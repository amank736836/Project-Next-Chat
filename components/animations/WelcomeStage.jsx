"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import {
  ArrowForward,
  ArrowOutward,
  WavingHandOutlined,
  Close,
  ForumOutlined,
  GroupsOutlined,
  ShieldOutlined,
  AutoAwesomeOutlined,
  LockOutlined,
  Check,
  DoneAll,
  Favorite,
} from "@mui/icons-material";

import { ChampMark } from "../shared/Brand";
export { ChampMark } from "../shared/Brand";

const features = [
  {
    icon: ForumOutlined,
    title: "Made for real conversations",
    text: "Less noise. More meaningful moments.",
    detail:
      "Pick up where you left off. Keep your one-to-one conversations together, share files, and stay connected with the people who matter to you.",
  },
  {
    icon: GroupsOutlined,
    title: "Your people, together",
    text: "Bring the whole group into the loop.",
    detail:
      "Create a group, add your friends, and give every shared plan a place to happen. Manage members and keep the conversation going, all in one space.",
  },
  {
    icon: ShieldOutlined,
    title: "A little more you. A little less public.",
    text: "Connect freely with anonymous messaging.",
    detail:
      "Your public profile has a dedicated link for anonymous messages. Share it with your circle and make room for honest feedback and unexpected conversations.",
  },
];

function ConversationArt() {
  return (
    <div
      className="conversation-art"
      role="img"
      aria-label="Illustration of friendly conversations, a group chat, and a typing indicator"
    >
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <span className="orbit-dot dot-one" />
      <span className="orbit-dot dot-two" />
      <span className="art-spark spark-one">✧</span>
      <span className="art-spark spark-two">✦</span>
      <div className="art-center">
        <svg viewBox="0 0 290 220" fill="none" aria-hidden="true">
          <defs>
            <linearGradient
              id="bubble-mint"
              x1="130"
              y1="100"
              x2="260"
              y2="220"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#9BD5BA" />
              <stop offset="1" stopColor="#4A9F7B" />
            </linearGradient>
            <filter
              id="bubble-shadow"
              x="-30%"
              y="-30%"
              width="170%"
              height="180%"
            >
              <feDropShadow
                dx="0"
                dy="12"
                stdDeviation="10"
                floodColor="#234c3b"
                floodOpacity=".1"
              />
            </filter>
          </defs>
          <g className="bubble-back" filter="url(#bubble-shadow)">
            <path
              d="M36 39C36 23 49 11 65 11H164C180 11 193 24 193 40V116C193 132 180 144 164 144H88L49 170L53 142C42 138 36 128 36 116V39Z"
              fill="white"
            />
            <circle cx="82" cy="78" r="7" fill="#47785F" />
            <circle cx="113" cy="78" r="7" fill="#47785F" />
            <circle cx="144" cy="78" r="7" fill="#47785F" />
          </g>
          <g className="bubble-front" filter="url(#bubble-shadow)">
            <path
              d="M119 105C119 90 131 78 146 78H232C247 78 259 90 259 105V166C259 181 247 193 232 193H229L234 218L201 193H146C131 193 119 181 119 166V105Z"
              fill="url(#bubble-mint)"
            />
            <path
              d="M161 143C175 157 197 157 211 143"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="162" cy="124" r="4" fill="white" />
            <circle cx="209" cy="124" r="4" fill="white" />
          </g>
        </svg>
      </div>
      <div className="floating-message message-hello">
        <span className="mini-avatar avatar-peach">
          J<span>✦</span>
        </span>
        <div>
          <span className="message-name">
            Jamie <small>just now</small>
          </span>
          <p>
            Hey! So glad you’re here <WavingHandOutlined className="wave" />
          </p>
        </div>
        <span className="message-reaction">
          <Favorite /> 1
        </span>
      </div>
      <div className="floating-message message-group">
        <div className="group-icon">
          <GroupsOutlined />
        </div>
        <div>
          <span className="message-name">
            The good company <span className="online-dot" />
          </span>
          <p>Good plans start with a great chat.</p>
          <div className="mini-avatar-stack">
            <i className="avatar-peach">J</i>
            <i className="avatar-lilac">A</i>
            <i className="avatar-mint">M</i>
            <small>+ your favorite people</small>
          </div>
        </div>
      </div>
      <div className="floating-message message-reply">
        <span>Right where I belong.</span>
        <span>
          <Favorite />
        </span>
        <DoneAll />
      </div>
      <div className="floating-message message-typing">
        <span className="mini-avatar avatar-lilac">A</span>
        <span className="typing-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="typing-label">typing</span>
      </div>
      <span className="art-caption">
        <span className="online-dot" /> A little hello can go a long way.
      </span>
    </div>
  );
}

export default function WelcomeStage({ children, onCreateAccount }) {
  const [dialog, setDialog] = useState(null);
  return (
    <div className="welcome-stage auth-motion-root">
      <header className="welcome-header">
        <Link
          href="/login"
          className="champ-brand"
          aria-label="Chat Champ home"
        >
          <ChampMark />
          <span>
            chat<span className="brand-light">champ</span>
            <span className="brand-period">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <button onClick={() => setDialog("why")}>Why Chat Champ</button>
          <button onClick={() => setDialog("how")}>
            How it works <ArrowOutward />
          </button>
        </nav>
        <div className="header-signup">
          <span>New around here?</span>
          <button onClick={onCreateAccount}>
            Join the conversation <ArrowUpRight />
          </button>
        </div>
      </header>
      <main className="welcome-main">
        <section className="welcome-story" aria-labelledby="welcome-title">
          <div className="story-eyebrow">
            <span className="eyebrow-dot" /> LESS SCROLLING. MORE CONNECTING.
          </div>
          <h1 id="welcome-title">
            Good conversations.
            <br />
            <span>Great connections.</span>
            <svg
              className="headline-spark"
              width="36"
              height="44"
              viewBox="0 0 36 44"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 29L20 8M15 33L33 27M3 18L4 2"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </h1>
          <p className="story-description">
            Your friends, your groups, your kind of conversations.
            <br className="desktop-break" /> A feel-good space to stay close,
            wherever life takes you.
          </p>
          <ConversationArt />
          <div className="story-pills">
            <span>
              <Check /> Free to be yourself
            </span>
            <span>
              <Check /> Better together
            </span>
            <span>
              <Check /> Always in the loop
            </span>
          </div>
        </section>
        <section
          className="welcome-form-area"
          aria-label="Your Chat Champ account"
        >
          <div className="welcome-form-card">{children}</div>
          <p className="form-assurance">
            <LockOutlined /> Your conversations start in a space of your own.
          </p>
        </section>
      </main>
      <section className="welcome-features" aria-label="Why Chat Champ">
        {features.map(({ icon: Icon, title, text }, index) => (
          <button
            className="welcome-feature"
            key={title}
            onClick={() => setDialog(index)}
          >
            <span className={`feature-icon feature-icon-${index}`}>
              <Icon />
            </span>
            <span>
              <strong>{title}</strong>
              <span className="feature-description">{text}</span>
            </span>
            <ArrowOutward className="feature-arrow" />
          </button>
        ))}
      </section>
      <footer className="welcome-footer">
        <span>
          © {new Date().getFullYear()} Chat Champ. Made for connection.
        </span>
        <span className="footer-note">
          A little less distance. A lot more connection. <AutoAwesomeOutlined />
        </span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "24px", p: 1, background: "#fbfdfb" },
        }}
        aria-labelledby="welcome-dialog-title"
      >
        <IconButton
          onClick={() => setDialog(null)}
          aria-label="Close"
          sx={{ position: "absolute", right: 16, top: 16 }}
        >
          <Close />
        </IconButton>
        <DialogContent className="welcome-dialog">
          <ChampMark />
          <h2 id="welcome-dialog-title">
            {typeof dialog === "number"
              ? features[dialog].title
              : dialog === "how"
                ? "A hello is all it takes."
                : "More connection. Less complication."}
          </h2>
          {typeof dialog === "number" ? (
            <p>{features[dialog].detail}</p>
          ) : dialog === "how" ? (
            <ol>
              <li>
                <strong>Make yourself at home.</strong>
                <p>
                  Create an account with your email, a username, and a profile
                  photo.
                </p>
              </li>
              <li>
                <strong>Find your people.</strong>
                <p>
                  Search for friends, send a request, or bring everyone into a
                  group.
                </p>
              </li>
              <li>
                <strong>Start a conversation.</strong>
                <p>Share a thought, send a photo, or simply say hello.</p>
              </li>
            </ol>
          ) : (
            <p>
              Chat Champ brings personal chats, group conversations, and
              anonymous messages into one welcoming space. No complicated setup.
              Just you and your people.
            </p>
          )}
          <button
            className="dialog-join"
            onClick={() => {
              setDialog(null);
              onCreateAccount();
            }}
          >
            Create your account <ArrowForward />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ArrowUpRight() {
  return <ArrowOutward fontSize="small" />;
}
