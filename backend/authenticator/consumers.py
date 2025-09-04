import os
import asyncio
import json
import time
import psutil
import redis.asyncio as redis
from channels.generic.websocket import AsyncWebsocketConsumer

# Shared Redis client
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
redis_client = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)

def get_timer_lock_key(room_name): return f"meeting:{room_name}:timer_active"
def get_room_client_count_key(room_name): return f"room:{room_name}:client_count"

def log_memory_usage(tag=""):
    process = psutil.Process(os.getpid())
    mem_mb = process.memory_info().rss / 1024 / 1024  # RSS in MB
    print(f"[MEMORY] {tag} — RSS Memory: {mem_mb:.2f} MB")

class MeetingSyncConsumer(AsyncWebsocketConsumer):
    timers = {}

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"meeting_{self.room_name}"

        print(f"[Server] 🔗 {self.channel_name} joined {self.room_group_name}")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        new_count = await redis_client.incr(get_room_client_count_key(self.room_name))
        print(f"🔌 Client connected — new count = {new_count}")
        log_memory_usage("After connect")

        state = await self.get_video_state()
        await self.send(text_data=json.dumps({"type": "initial_state", "state": state}))

    async def disconnect(self, close_code):
        print(f"🔌 Disconnecting {self.channel_name} from {self.room_group_name}")
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        new_count = await redis_client.decr(get_room_client_count_key(self.room_name))
        print(f"📉 Client count is now {new_count}")
        log_memory_usage("After disconnect")

        if new_count <= 0:
            cls = type(self)
            task = cls.timers.get(self.room_group_name)
            if task and not task.done():
                print(f"⛔ No clients left — stopping timer.")
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    print(f"✅ Timer cancelled cleanly.")
                cls.timers.pop(self.room_group_name, None)

    async def broadcast_timer_loop(self):
        print(f"⏱️ Starting timer for {self.room_group_name}")
        try:
            while True:
                await asyncio.sleep(0.25)
                state = await self.get_video_state()

                print(f"[{self.room_group_name}] ⏳ time={state['current_time']:.2f}, speed={state['speed']}, stopped={state['stopped']}")

                if not state["stopped"]:
                    state["current_time"] += 0.25 * state["speed"]
                    await self.set_video_state(state)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "broadcast_sync",
                        "message": json.dumps({
                            "type": "sync_update",
                            "state": state,
                            "sent_at": time.time()
                        })
                    }
                )
        except asyncio.CancelledError:
            print(f"⛔ Timer for {self.room_group_name} cancelled.")

    async def receive(self, text_data):
        try:
            msg = json.loads(text_data)
        except json.JSONDecodeError:
            print(f"[{self.channel_name}] ❌ Invalid JSON")
            return

        if msg.get("type") == "start_meeting":
            cls = type(self)
            old_task = cls.timers.get(self.room_group_name)
            if old_task and not old_task.done():
                print(f"🔁 Restarting timer")
                old_task.cancel()
                try: await old_task
                except asyncio.CancelledError: pass

            loop = asyncio.get_event_loop()
            new_task = loop.create_task(self.broadcast_timer_loop())
            cls.timers[self.room_group_name] = new_task

            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "meeting_started", "started": True}
            )
            return

        if msg.get("type") == "update_state":
            await self.update_video_state(msg)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "broadcast_sync", "message": text_data}
        )

    async def broadcast_sync(self, event):
        try:
            await self.send(text_data=event["message"])
        except Exception as e:
            print(f"[Broadcast Error] Failed to send: {e}")

    async def meeting_started(self, event):
        await self.send(text_data=json.dumps({
            "type": "meeting_started",
            "started": event["started"]
        }))

    async def get_video_state(self):
        key = self.get_video_state_key()
        state_raw = await redis_client.get(key)
        if state_raw:
            return json.loads(state_raw)
        default_state = {"stopped": True, "current_time": 0.0, "speed": 1.0}
        await redis_client.set(key, json.dumps(default_state))
        return default_state

    async def set_video_state(self, new_state):
        key = self.get_video_state_key()
        await redis_client.set(key, json.dumps(new_state))

    async def update_video_state(self, update):
        state = await self.get_video_state()
        if "stopped" in update: state["stopped"] = update["stopped"]
        if "current_time" in update: state["current_time"] = update["current_time"]
        if "speed" in update: state["speed"] = update["speed"]
        await self.set_video_state(state)

    def get_video_state_key(self):
        return f"video_state:{self.room_group_name}"
