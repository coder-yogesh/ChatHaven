import React, { useState } from "react";
import { Modal, Segmented, Input, Button, Tag, Space } from "antd";
import {
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  KeyOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from "@ant-design/icons";

/**
 * Settings modal opened from the avatar dropdown.
 *
 * Props:
 *  open, onClose()
 *  theme, onThemeChange(theme)
 *  groqKey              - the user's Groq API key (state lives in App.js,
 *                          persisted to localStorage there)
 *  onGroqKeyChange(key)  - controlled input handler
 *  groqKeyStatus         - 'unknown' | 'checking' | 'valid' | 'invalid'
 *  onValidateGroqKey()   - tests the current key against the backend
 */
export default function SettingsModal({
  open,
  onClose,
  theme,
  onThemeChange,
  groqKey,
  onGroqKeyChange,
  groqKeyStatus,
  onValidateGroqKey,
}) {
  const [reveal, setReveal] = useState(false);

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

      <div className="settings-section">
        <div className="settings-label">
          <KeyOutlined /> Groq API key
        </div>

        <Space.Compact block>
          <Input.Password
            value={groqKey}
            onChange={(e) => onGroqKeyChange(e.target.value)}
            placeholder="gsk_..."
            visibilityToggle={{ visible: reveal, onVisibleChange: setReveal }}
          />
          <Button onClick={onValidateGroqKey} loading={groqKeyStatus === "checking"} disabled={!groqKey?.trim()}>
            Test
          </Button>
        </Space.Compact>

        <div className="settings-key-status">
          {groqKeyStatus === "valid" && (
            <Tag icon={<CheckCircleFilled />} color="success">
              Key works
            </Tag>
          )}
          {groqKeyStatus === "invalid" && (
            <Tag icon={<CloseCircleFilled />} color="error">
              Key rejected
            </Tag>
          )}
          {groqKeyStatus === "unknown" && groqKey?.trim() && <Tag>Not verified yet — tap Test</Tag>}
        </div>

        <div className="settings-hint">
          Used only for your own chat requests — it's saved in this browser and never sent
          to or stored on our servers. Get a free key at{" "}
          <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
            console.groq.com/keys
          </a>
          .
        </div>
      </div>
    </Modal>
  );
}