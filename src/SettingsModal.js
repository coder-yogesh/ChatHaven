import React from "react";
import { Modal, Segmented } from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";

/**
 * Settings modal opened from the avatar dropdown. Currently just theme,
 * but this is where future preferences (notifications, model choice, etc.)
 * would live too.
 *
 * Props:
 *  open, onClose()
 *  theme        - 'light' | 'dark' | 'system'
 *  onThemeChange(theme)
 */
export default function SettingsModal({ open, onClose, theme, onThemeChange }) {
  return (
    <Modal
      title="Settings"
      open={open}
      onCancel={onClose}
      footer={null}
      className="settings-modal"
    >
      <div className="settings-section">
        <div className="settings-label">Theme</div>
        <Segmented
          value={theme}
          onChange={onThemeChange}
          options={[
            { label: "Light", value: "light", icon: <SunOutlined /> },
            { label: "Dark", value: "dark", icon: <MoonOutlined /> },
            { label: "System", value: "system", icon: <DesktopOutlined /> },
          ]}
          block
        />
        <div className="settings-hint">
          "System" follows your OS's light/dark setting automatically.
        </div>
      </div>
    </Modal>
  );
}