# 00 — Project kickoff

## What I needed
Start the NEXUS-COMMERCE capstone with Claude Code as the development assistant, while staying in control of every decision, and follow proper SDLC phases.

## First prompt (as sent, lightly cleaned for typos)
```
This is the project and these are the deliverables. I have to work on this assignment
using efficient prompt engineering and context engineering.

Claude Code does the development work, but I want everything customised: I am
responsible for every piece of work and every API created. As the Beyond-prompting
GitHub repo says, efficient prompting needs to state the output structure, a role,
and specify exactly what we need.

I don't want to compromise on quality, and it needs to be deployed/hosted.

Also implement the assignment in this directory in the form of SDLC stages:
planning phase, then architecture.md, etc., according to the assignment file.
Then restructure the current directory as per the suggested file layout.
```
Context given: the assignment PDF in the project folder.

## What went wrong with the first attempt
The AI picked a stack on its own (React + browser localStorage, no backend) and began writing planning and architecture documents without asking me.

## Second prompt (my correction)
```
For all decisions of all types, discuss them with me in simple language. Ask me
simple questions, and explain each scenario in simple English along with what the
documentation actually says about the requirement.

First we make suitable prompts for the application, then we execute them.

For the architecture, let's make it first, plan it together, confirm it as the .md,
and then draw it in draw.io (you will make it).

Then execute our plan through all SDLC steps: planning, requirements engineering,
functional and non-functional requirements, design, frontend or backend first and
then the other, testing, and deployment. Each phase has its own prompt, and then we
execute it.
```

## What I learned
- Without explicit constraints, the AI makes big decisions by itself. Saying "ask me first, in simple words, and quote the brief" changed how the whole project went.
- Writing one prompt per phase and approving it before running it keeps the prompt logs real. Every prompt in this folder was approved by me before it was executed.

## Decisions made through the discussion
| Question | My answer |
|---|---|
| Backend? | Yes, real APIs |
| Database | Supabase (Postgres + Storage) |
| Language | Python backend (FastAPI), React frontend |
| Deployment | React on Vercel, FastAPI on Render (free and easy) |
| Currency | PKR |

## Result
Folder restructured to the suggested layout (`docs/`, `prompts/`, `screenshots/`, `backend/`, `frontend/`). The brief moved to `docs/assignment/`.
