import React, { useState, useEffect } from "react";
import { Comment, CommentEditor } from "./components/index";
import styled from "styled-components";
import Icon, { LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { Menu, Dropdown, Divider } from "antd";
import { Button } from "./components/Button";
import Blockie from "./components/Blockie";
import { SkynetClient } from "skynet-js";
import { generateUsername } from "unique-username-generator";
import { Modal } from "antd";

const DropdownItem = styled.div`
  display: flex;
  align-items: center;

  & svg {
    margin-right: 7px;
  }

  ${props =>
    props.disabled
      ? `
      cursor: not-allowed;
      opacity: 0.5;
  `
      : ""}
`;
const Footer = styled.span`
  display: block;
  color: #555;
  font-weight: normal;
  font-size: 0.8rem;
  margin-top: 12px;
`;
const PanelContainer = styled.div`
  display: flex;
  align-items: center;
`;
const Profile = styled.div`
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 3px;
  margin-right: 5px;
  display: flex;
  align-items: center;
  padding: 2px;

  & canvas {
    width: 25px;
    height: 25px;
    border-radius: 3px;
  }
`;
const Input = styled.input`
  width: 100%;
  border: 0;
  outline: none;
  padding: 7px;
  border-bottom: 1px solid #ddd;
  resize: none;

  &:disabled {
    background: white;
    cursor: not-allowed;
  }
`;

// Skynet Client
const client = new SkynetClient("https://siasky.net");
const hostApp = "host-app.hns";
let mySky = null;

const CommentWidget = ({ commentURL }) => {
  const [username, setUsername] = useState("");
  const [usernameSettingValue, setUsernameSettingValue] = useState("");
  const [comments, setComments] = useState([]);
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [isProfileSettingModalOpen, setIsProfileSettingModalOpen] = useState(false);

  const getMySky = async () => {
    if (mySky === null) {
      mySky = await client.loadMySky(hostApp);
    }
    return mySky;
  };

  const handleSubmit = async () => {
    setError("");
    if (!value.trim()) return;
    if (value.length > 2000) {
      setError("character limit exceeded (maximum: 2000 characters)");
      return;
    }
    setIsLoading(true);
    try {
      setComments([
        ...comments,
        {
          data: value.trim(),
          likes: [],
          publicAddress: username,
          authorPublicAddress: username,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      setValue("");
    } catch (e) {
      setError(e.message);
    }
    setIsLoading(false);
  };

  const checkSignInWithMySkyID = async () => {
    try {
      setIsLoading(true);
      const mySky = await getMySky();
      const loggedIn = await mySky.checkLogin();

      console.log("MySky ID Login Status =", loggedIn);
      setIsLoggedIn(loggedIn);

      // Add button action for login.
      if (!loggedIn) {
        document.getElementById("login-button").addEventListener("click", async e => {
          const result = await mySky.requestLoginAccess();
          console.log("requestLoginAccess result = ", result);
          setIsLoggedIn(result);
        });
      }
    } catch (error) {
      setError(error);
    }

    setIsLoading(false);
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const mySky = await getMySky();
      await mySky.logout();
      setIsLoggedIn(false);
    } catch (error) {
      setError(error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    checkSignInWithMySkyID();
  }, []);

  // load username (if username not setted: generate new username)
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    (async () => {
      try {
        const mySky = await getMySky();
        const { data, dataLink } = await mySky.getJSON(`${hostApp}/profile.json`);
        if (dataLink === null) {
          const username = generateUsername();
          const { data } = await mySky.setJSON(`${hostApp}/profile.json`, { username });
          setUsername(data.username);
        } else {
          setUsername(data.username);
        }
      } catch (error) {
        setError(error);
      }
    })();
  }, [isLoggedIn]);

  const profileOptions = (
    <Menu>
      <Menu.Item key="address">
        <DropdownItem disabled>Username: {username}</DropdownItem>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="2" onClick={() => setIsProfileSettingModalOpen(true)}>
        <DropdownItem>
          <SettingOutlined />
          <div>Profile Setting</div>
        </DropdownItem>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        danger
        key="signout"
        onClick={() => {
          signOut();
        }}
      >
        <DropdownItem>
          <Icon component={LogoutOutlined} />
          <div>Sign Out</div>
        </DropdownItem>
      </Menu.Item>
    </Menu>
  );

  const commentEditorFooter = (
    <>
      {!isLoggedIn && (
        <Button id="login-button" loading={isLoading}>
          Sign in with MySky ID
        </Button>
      )}
      {isLoggedIn && (
        <PanelContainer>
          <Dropdown overlay={profileOptions} trigger={["click"]} placement="topRight">
            <Profile>
              <Blockie address={username || "default"} size={7} />
            </Profile>
          </Dropdown>
          <Button loading={isLoading} onClick={isLoading ? () => {} : handleSubmit}>
            Comment
          </Button>
        </PanelContainer>
      )}
    </>
  );

  return (
    <>
      <Modal
        title="Profile Setting"
        visible={isProfileSettingModalOpen}
        onOk={async () => {
          if (!usernameSettingValue) return;

          try {
            const mySky = await getMySky();
            const { data, dataLink } = await mySky.getJSON(`${hostApp}/profile.json`);
            if (dataLink !== null && data !== null) {
              const { data } = await mySky.setJSON(`${hostApp}/profile.json`, { username: usernameSettingValue });
              setUsername(data.username);
            }
          } catch (error) {
            setError(error);
          }

          setUsernameSettingValue("");
          setIsProfileSettingModalOpen(false);
        }}
        onCancel={() => setIsProfileSettingModalOpen(false)}
      >
        <Input
          value={usernameSettingValue}
          onChange={e => setUsernameSettingValue(e.target.value)}
          placeholder="Username"
        />
      </Modal>

      <h3>{comments.length} comments</h3>
      <div style={{ marginTop: 24 }}>
        {comments.map((comment, i) => {
          return <Comment commentURL={commentURL} {...comment} key={`comment_${i}`} />;
        })}
      </div>
      <Divider />

      <CommentEditor
        footer={commentEditorFooter}
        error={error}
        value={value}
        onChange={setValue}
        placeholder="Write a comment..."
        loading={isLoading}
      />

      <Footer>
        Powered by{" "}
        <a href={`${process.env.NODE_ENV === "development" ? "http" : "https"}://${document.domain}`} target="_blank">
          SkyComment
        </a>
      </Footer>
    </>
  );
};

export default CommentWidget;
