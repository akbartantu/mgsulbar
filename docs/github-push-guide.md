# Step-by-Step: How to Push This Project to GitHub

This guide shows you how to put this project on GitHub and how to send your updates there. It is written in simple steps so you can follow even if you have never used Git or GitHub before.

---

## Before You Start

You need a few things ready:

1. **Git on your computer**  
   Git is the tool that tracks your code and sends it to GitHub.  
   To see if it is installed, open a terminal and type:
   ```bash
   git --version
   ```
   If you see a version number, you are good. If you get an error, install Git from [git-scm.com](https://git-scm.com/).

2. **A GitHub account**  
   Sign up at [github.com](https://github.com) if you do not have one.

3. **This project folder on your computer**  
   You should have the project folder (for example `15 MGSULBAR`) on your machine.

4. **A repository on GitHub (optional the first time)**  
   This project’s repo is: [https://github.com/akbartantu/mgsulbar](https://github.com/akbartantu/mgsulbar).  
   If you are using your own copy, create a new repository on GitHub: click **New repository**, give it a name (e.g. `mgsulbar`), then **Create repository**. Do **not** add a README if your project already has files you will push.

---

## First Time Only: Connect Your Folder to GitHub

You only do this once for this project.

1. **Open a terminal in the project folder**  
   In Cursor or VS Code: **Terminal → New Terminal**.  
   Or open PowerShell / Command Prompt and go to the folder, for example:
   ```powershell
   cd "d:\02 PERSONAL\03 PROJECT\15 MGSULBAR"
   ```
   Use the real path where your project lives.

2. **If this folder has never been a Git repo**  
   Run:
   ```bash
   git init
   ```
   That creates a new Git repository inside the folder.

3. **Tell Git where GitHub is**  
   Run (use your repo URL if it is different):
   ```bash
   git remote add origin https://github.com/akbartantu/mgsulbar.git
   ```
   **“origin”** is just a short name for “the copy of this project on GitHub.” You will use it every time you push.

4. **If the folder is already a Git repo**  
   You can skip the steps above. To check if `origin` is already set, run:
   ```bash
   git remote -v
   ```
   If you see `origin` and a URL, you are already connected.

---

## Saving Your Work in Git (Commit)

“Saving” in Git means two steps: **stage** and **commit**. Until you push, the save only exists on your computer.

1. **Stage all changed files**  
   This means “mark these files to be saved in the next commit.”
   ```bash
   git add -A
   ```
   `-A` means “all changed files.”

2. **Commit (save) with a message**  
   A commit is like a saved snapshot. You must give it a short description.
   ```bash
   git commit -m "Short description of what you did"
   ```
   Example: `git commit -m "fix: fix login button"`  
   The message is required so you (and others) know what changed.

This save is only on your computer until you push.

---

## Sending Your Work to GitHub (Push)

**Push** means “upload my commits to GitHub.”

1. **See which branch you are on**  
   Run:
   ```bash
   git branch
   ```
   The branch with a `*` in front is the one you are on (e.g. `deploy` or `master`).

2. **Push that branch to GitHub**  
   Use the branch name you see (e.g. `deploy` or `master`):
   ```bash
   git push -u origin deploy
   ```
   Replace `deploy` with your branch name if it is different.  
   **“origin”** = GitHub. **“deploy”** = the branch name.  
   The first time you push a branch, use `-u` so Git remembers “deploy on my PC” = “deploy on GitHub.” After that you can just run:
   ```bash
   git push
   ```

3. **If GitHub asks you to log in**  
   Use a **Personal Access Token** as the password, not your normal GitHub password. You can create a token in GitHub: **Settings → Developer settings → Personal access tokens**.

---

## Full Flow: “I Changed Files and Want Them on GitHub”

Do this every time you finish a chunk of work and want it on GitHub:

1. Open a terminal in the project folder.
2. Switch to your branch (e.g. deploy):  
   `git checkout deploy`
3. Stage all changes:  
   `git add -A`
4. Commit with a message:  
   `git commit -m "Describe what you did"`
5. Push to GitHub:  
   `git push origin deploy`  
   (or just `git push` if you already set `-u` before.)

Repeat these steps whenever you have new changes to send.

---

## Branches in Simple Words

A **branch** is a separate line of work. The main line is usually called `master` or `main`. We use a branch called **deploy** to test changes before they go to the main line.

- **Create a new branch and switch to it:**  
  `git checkout -b nama-cabang`  
  Example: `git checkout -b fix-button`
- **Switch to an existing branch:**  
  `git checkout nama-cabang`  
  Example: `git checkout deploy`
- **Our workflow:**  
  Do your work and push on the **deploy** branch. When CI (the automatic checks) is green, merge **deploy** into **main** (e.g. with a Pull Request on GitHub, or by merging locally and then pushing **main**).

---

## Troubleshooting

- **“Nothing to commit, working tree clean”**  
  Either you have no changes, or you already committed everything. Run `git status` to see.

- **“Permission denied” or “Authentication failed”**  
  Use a **Personal Access Token** instead of your GitHub password when Git asks for a password.

- **“Updates were rejected”**  
  Someone else (or you on another computer) already pushed to the same branch. First get their changes, then push again:
  ```bash
  git pull origin deploy
  git push origin deploy
  ```
  Use your branch name instead of `deploy` if needed.

---

## Quick Reference

| What you want to do        | Command |
|----------------------------|--------|
| See status (changed files, branch) | `git status` |
| See current branch        | `git branch` |
| Stage all changes         | `git add -A` |
| Commit with message       | `git commit -m "Your message"` |
| Push to deploy branch     | `git push origin deploy` |
| Push to main branch       | `git push origin master` (or `main`) |
| Get latest from GitHub    | `git pull origin deploy` (or your branch) |
| Switch to deploy branch   | `git checkout deploy` |
| Create and switch to new branch | `git checkout -b nama-cabang` |
