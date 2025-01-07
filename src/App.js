import { useEffect, useState } from 'react';
import './App.css';
import Googlelogo from './assets/Google Logo.png';
import Logo from './assets/large-removebg-preview.png';
// import ReactMarkdown from 'react-markdown';
import { Avatar, Button, Card, Col, Dropdown, Flex, Input, Layout, Menu } from 'antd';
import { chatGpt } from './services/api';
import { Content, Footer, Header } from 'antd/es/layout/layout';
import { GoogleOutlined, OpenAIOutlined, RightCircleOutlined } from '@ant-design/icons';
import { BrowserRouter, Route, Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import TextArea from 'antd/es/input/TextArea';
// import DomPurity from 'dompurify';

const headerStyle = {
  textAlign: 'center',
  background: 'transparent',
  height: 64,
  borderBottom: '1px solid #dedede',
  paddingInline: 48,
  lineHeight: '64px',
};

const contentStyle = {
  textAlign: 'center',
  minHeight: 120,
  background: '#0221a061',
  padding: 20,
  height: 550,
  overflowY: 'auto',
};

const footerStyle = {
  textAlign: 'center',
  color: '#fff',
  background: '#0221a061'
};

const layoutStyle = {
  overflow: 'hidden',
  width: '100%',
  background: 'transparent'
};

const sample = {
  cursor: 'pointer',
  margin: '10px',
  marginTop: '0px',
  padding: '20px',
  minWidth: 'fit-content',
  marginLeft: '0px',
  borderRadius: 10,
  background: '#DFD5EC',
  border: 'none'
}

// bubble css
// const bubble = {
//   background: 'gray',
//   borderRadius: '1.5rem',
//   padding: '15px'
// }

// html content display
// const SafeHtmlComponent = ({ stringValue }) => {
//   const sanitizedHtml = DomPurity.sanitize(stringValue);
//   console.log('html', sanitizedHtml);
//   return (
//       <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></div>
//   );
// };

function App() {
  const Home = () => {
    const [q, setq] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userDetails, setUserDetails] = useState(() => {
      // Load initial state from localStorage
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    });
    // const [displayedMessage, setDisplayedMessage] = useState(''); // GPT message display step by step
    // const [isGPTMessage, setIsGPTMessage] = useState(false);
    // const [currentMessage, setCurrentMessage] = useState(null);
  
    // useEffect(() => {
    //   if (!currentMessage) return;
    
    //   let step = 0;
    //   setDisplayedMessage(''); // Clear previous displayed message
    
    //   const timer = setInterval(() => {
    //     if (step < currentMessage.length) {
    //       setDisplayedMessage((prev) => prev + currentMessage[step]);
    //       step += 1;
    //     } else {
    //       clearInterval(timer); // Stop the interval once the full message is displayed
    //       setIsGPTMessage(false); // Reset the flag
    //     }
    //   }, 1); // Adjust the speed of step-by-step display (in ms)
    
    //   return () => clearInterval(timer);
    // }, [currentMessage]); 
    window.copyCode = (codeId) => {
      const codeBlock = document.getElementById(codeId);
      if (codeBlock) {
        const codeContent = codeBlock.textContent || codeBlock.innerText;
        navigator.clipboard.writeText(codeContent)
          .then(() => alert('copied'))
          .catch(() => console.error('failed'))
      }
    }
    const submit = async (text) => {
      if (!text) return;
      setLoading(true);
      const userMessage = { type: 'user', message: text }; // `message` is null initially
      setMessages((prev) => [...prev, userMessage]);
      console.log('ddd', userMessage);
      setq('');
      // Call the API and update the response
      try {
        // Call the API and update the response
        let headingCounter = 0;
        const res = await chatGpt(text);
        const formattedMessage = res.message
          .replace(/^\d+\.\s*/gm, '')
          .replace(/(\*\*.+?\*\*)\n+/g, '$1')
          .replace(/(```[\s\S]+?```)\n/g, '$1')
          .replace(/\*\*(.+?)\*\*/g, (match, headingContent) => {
            headingCounter++; // Increment the heading counter
            return `<div class="gpt-heading">${headingContent}</div>`;
          })
          // .replace(/\*\*(.+?)\*\*/g, '<div class="gpt-heading">$1</div>')
          .replace(/```([\s\S]+?)```/g, (match, codeContent) => {
            // Create a unique ID for each code block
            const codeId = 'codeBlock-' + Math.random().toString(36).substr(2, 9);
            
            return `
              <div class="code-container">
                <button class="copy-btn"
                  onclick="copyCode('${codeId}')">Copy</button>
                <pre class="code-block" id="${codeId}" key="${codeId}"><code>${codeContent}</code></pre>
              </div>
            `;
          });
          // .replace(/```([\s\S]+?)```/g, (match, codeContent) => {
          //   // Create a unique ID for each code block to target specific ones
          //   const codeId = 'codeBlock-' + Math.random().toString(36).substr(2, 9);
            
          //   return `
          //       <pre class="code-block" id="${codeId}" key="${codeId}"><code>${codeContent}</code></pre>
          //   `;
          // });
          

          // .replace(/```([\s\S]+?)```/g, '<pre class="code-block"><code>$1</code></pre>');
        const updatedArray = { type: 'gpt', message: formattedMessage };
        setMessages((prev) => [...prev, updatedArray]);
      } catch (error) {
        console.error('Error calling chatGPT API:', error);
      } finally {
        setLoading(false); // Set loading to false
      }
    }
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      console.log('ddd', window.location.pathname);
      const token = urlParams.get("token");
      if (token) {
        const decodedToken = jwtDecode(token);
        localStorage.setItem('user', JSON.stringify(decodedToken));
        localStorage.setItem('token', token);
        navigate('/dashboard');
        setUserDetails(decodedToken);
      }
    }, [location, navigate, userDetails]);
    const logout = () => {
      localStorage.clear();
      window.location.href = "http://localhost:4000/api/auth/logout"
    }
    const handleMenuClick = ({ key }) => {
      switch (key) {
        case "profile":
          break;
        case "settings":
          break;
        case "logout":
          logout();
          break;
        default:
          break;
      }
    };
    const menu = [
      // { key: "profile", label: "Profile" },
      // { key: "settings", label: "Settings" },
      { key: "logout", label: "Logout" },
    ];
    const samplemessage = [
      { message: 'Sample javascript code?' },
      { message: 'What is the best way to structure my project when using Node.js with Express and PostgreSQL?' },
      { message: 'Help write SQL to generate a report' }
    ]
    return (
    <Flex gap="middle" wrap style={{ height: '100vh' }} justify='center'>
        <Layout style={layoutStyle}>
          <Header style={headerStyle}>
            <Flex justify='space-between'>
              <Col span={12}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex' }}>
                      <img src={Logo} width={50} height={50} style={{ marginTop: '10px' }}/>
                      <h1 style={{ marginTop: '0px' }}>
                        ChatHaven (new)
                      </h1>
                    </div>
              </Col>
              
              <Col>
                  <div>
                      {
                        userDetails ? (
                          <Col style={{ display: 'flex' }}>
                            <h3 style={{ margin: '0px' }}>
                              {userDetails?.user.name}
                            </h3>
                            <Dropdown
                              menu={{
                                items: menu,
                                onClick: handleMenuClick, // Attach the click handler here
                              }}
                              placement="bottomRight"
                              trigger={['click']}>
                                
                              <Avatar
                                src={`${process.env.REACT_APP_API_URL}proxy-image?url=${encodeURIComponent(userDetails?.user.picture)}`}
                                size="large"
                                loading="lazy"
                                style={{ cursor: "pointer", marginTop: '10px' }}
                              >
                                {/* {userDetails?.user.name?.charAt(0)} */}
                              </Avatar>
                            </Dropdown>
                          </Col>
                        ) : ''
                      }
                    </div>
                  </Col>
            </Flex>
          </Header>
          <Content style={contentStyle}>
            
            <Flex justify='center' align='flex-end'>
              <Col span={12} style={{ padding: '30px' }}>
              
              { messages.length > 0 ?
                <div>
                {messages.map((msg, index) => (
                  <div key={index}>
                    {msg.type === 'gpt' ? (
                      <div style={{ display: 'flex' }}>
                        <div>
                        <OpenAIOutlined style={{fontSize: '25px', paddingRight: '10px'}} />
                        </div>
                        <Flex justify='flex-start'>
                          <div
                            style={{
                              padding: '5px 10px',
                              borderRadius: '10px',
                              background: 'lightgray',
                              boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
                              whiteSpace: 'pre-line',
                              textAlign: 'left',
                              padding: '10px',
                            }}
                            dangerouslySetInnerHTML={{ __html: msg.message }}
                          />
                          {/* <div>
                          <ReactMarkdown
                            children={msg.message}
                            style={{
                              borderRadius: '10px',
                              background: 'lightgray',
                              textAlign: 'left',
                              padding: '10px',
                            }}
                          />
                          </div> */}
                          {/* { loading && <div>...</div>}
                          <div style={{
                            alignItems: 'start',
                            padding: '5px 10px',
                            borderRadius: '10px',
                            background: 'lightgray'
                          }}>
                            <div style={{
                              whiteSpace: "pre-line", 
                              textAlign: 'left',
                              padding: '10px' }} dangerouslySetInnerHTML={{ __html: msg.message }}>
                                
                            </div>
                            
                          </div> */}
                        </Flex>
                      </div>
                    ) : (
                        <Flex justify='flex-end' style={{ 
                          paddingBottom: '10px',
                          paddingTop:'10px'
                        }}>
                          <div style={{
                            background: '#e6f7ff', 
                            borderRadius: '1.5rem',
                            whiteSpace: 'pre-wrap',
                            boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
                            padding: '15px'}}>{msg.message}
                          </div>
                          <Avatar
                            loading="lazy"
                            style={{ 
                              minWidth: '24px',
                              maxWidth: '24px',
                              margin: '10px', }}
                              src={`${process.env.REACT_APP_API_URL}proxy-image?url=${encodeURIComponent(userDetails?.user.picture)}`}
                            size="small">
                                {/* {userDetails?.user.name?.charAt(0)} */}
                            </Avatar>
                        </Flex>
                    )}
                  </div>
                ))}
                </div> : <div>
                  <Col style={{ textAlign: 'left' }}>
                    <h1>Hello, Team</h1>
                    <h2>How can i help you today?</h2>
                    <h5>Examples:</h5>
                    <div style={{ display: 'grid' }}>
                      {
                        samplemessage.map((d) => (
                          <Col key={d.message} style={sample} onClick={() => submit(d.message)}>
                            {d.message}
                          </Col>
                        ))
                      }
                    </div>
                  </Col>
                </div>
              }
              </Col>
            </Flex>
          </Content>
          <Footer style={footerStyle}>
            <Flex justify="center" align="flex-end">
              <Col span={12} style={{ display: 'flex' }}>
              <TextArea
                value={q}
                placeholder="Message ChatHaven"
                onChange={(e) => setq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { // Submit on Enter, allow line break with Shift+Enter
                    e.preventDefault(); // Prevent newline from being added
                    submit(q);
                  }
                }}
                autoSize={{ minRows: 2, maxRows: 4 }} // Automatically adjust height
              />
              {/* <Button
                type="primary"
                icon={<RightCircleOutlined />}
                loading={loading} // Show loading spinner while waiting for response
                onClick={() => submit(q)}
              >
              </Button> */}
              {/* <Button type="primary" onClick={() => submit(q)}>
                <RightCircleOutlined style={{ fontSize: '20px' }} />
              </Button> */}
              {/* <Input value={q}
                placeholder='Message ChatHaven'
                onChange={(e) => setq(e.target.value)} />
              <Button type='primary' onClick={() => submit(q)}>
                <RightCircleOutlined style={{ fontSize: '20px' }}/>
              </Button> */}
              </Col>
            </Flex>
          </Footer>
        </Layout>
    </Flex>
    )
  }
  const Login = () => {
    const submitGo = () => {
      window.location.href = "http://localhost:4000/api/auth/google"
    }
    return (
      <Flex
        gap="middle"
        wrap
        style={{ 
          height: '100vh', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }} 
        justify='center'>
        <Layout style={{ width: '100%', background: 'transparent' }}>
          <Content>
            <Flex justify='center' align='center'>
              <Col style={{ textAlign: 'center' }}>
                <div>
                  <img src={Logo} width={300}/>
                </div>
                <h3>Let's start the coding with ChatHaven</h3>
                <Button onClick={() => submitGo()} size="large">
                  <img src={Googlelogo} />
                  Continue with google
                </Button>
              </Col>
            </Flex>
          </Content>
        </Layout>
      </Flex>
    )
  }
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}></Route>
        <Route path="/dashboard" element={<Home/>}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
