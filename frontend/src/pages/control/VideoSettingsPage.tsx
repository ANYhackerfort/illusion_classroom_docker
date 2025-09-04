import React from "react";
import VideoStatus from "../../components/videoDisplayer/DisplayWithBar";
import "./vsp.css";

const VideoSettingsPage: React.FC = () => {
  return (
    <div className="video-settings-page">
      <h1 className="main-title">Video Control Page</h1>

      <div className="settings-row">
        <div className="settings-title">Video Status</div>
        <ul className="settings-description">
          <li>
            After you <strong>drag in the edited video</strong>, you can{" "}
            <strong>pause and play</strong> it using the{" "}
            <strong>space bar</strong> or by simply{" "}
            <strong>clicking on the video</strong>. You can also{" "}
            <strong>click on the timeline</strong> to jump to a specific spot
            and use the <strong>zoom feature</strong> for more precise
            selection.
          </li>
          <li>
            You can <strong>replace the video</strong>, but you{" "}
            <strong>cannot stack</strong> videos on top of one another.
            <strong>
              Whatever is displayed here will also be shown in the meeting room.
            </strong>
          </li>
        </ul>
        <VideoStatus />
      </div>

      <div className="settings-row">
        <h2 className="settings-title">Advanced Video Control</h2>
        <ul className="settings-description">
          <li>
            Adjust <strong>volume</strong>, <strong>speed</strong>, enable{" "}
            <strong>subtitles</strong> or <strong>filters</strong>, and try out{" "}
            <strong>AI Assist</strong> for enhanced playback.
          </li>
        </ul>
        <div className="control-panel-container">
          <div className="control-panel">
            <div className="control-item">
              <label className="slider-label">Speed</label>
              <div className="slider-wrapper">
                <input
                  id="speed"
                  type="range"
                  min="0.25"
                  max="2"
                  step="0.05"
                  className="slider vertical"
                />
              </div>
            </div>

            <div className="control-item">
              <label className="slider-label">Volume</label>
              <div className="slider-wrapper">
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  className="slider vertical"
                />
              </div>
            </div>

            {/* Subtitles Toggle */}
            <div className="control-item horizontal-toggle">
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="slider-toggle"></span>
              </label>
              <span className="toggle-label">Enable Subtitles</span>
            </div>

            {/* Filter Toggle */}
            <div className="control-item horizontal-toggle">
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="slider-toggle"></span>
              </label>
              <span className="toggle-label">Filter</span>
            </div>

            {/* AI Assistance */}
            <div className="control-item horizontal-toggle">
              <label className="rainbow-toggle">
                <input type="checkbox" />
                <span className="rainbow-slider"></span>
              </label>
              <span className="toggle-label">ALLOW AI Assistance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSettingsPage;
