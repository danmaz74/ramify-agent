# The ramify-agent development image. Adapted from the Ramify toolkit's
# devcontainer at 1d8a43fc6ba5c214f2a53d0411f4d7f832e70eb5; cucumber-viz and
# PM2 stay with the toolkit. The build context is the agent repository, and
# nothing is copied from it (see Dockerfile.dockerignore).
FROM node:22.23.3-bookworm

# Tools, shell niceties, and Chromium for Playwright and screenshots.
RUN apt-get update -qq && apt-get install -y \
    build-essential \
    git \
    curl \
    wget \
    vim \
    zsh \
    sudo \
    readline-common \
    libreadline-dev \
    ncurses-base \
    ncurses-term \
    fzf \
    ripgrep \
    bat \
    exa \
    zsh-syntax-highlighting \
    zsh-autosuggestions \
    htop \
    jq \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# node:22 ships a `node` user at uid/gid 1000, which collides with the host
# user on native-Linux Docker and makes the bind-mounted workspace read-only.
# Free the IDs and give them to `app`, which then owns the mounted files.
ARG USER_UID=1000
ARG USER_GID=1000
RUN userdel -r node 2>/dev/null || true; groupdel node 2>/dev/null || true; \
    groupadd -g ${USER_GID} app && \
    useradd -m -u ${USER_UID} -g ${USER_GID} -s /usr/bin/zsh app && \
    usermod -aG sudo app && \
    echo 'app ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

USER app

WORKDIR /workspaces/ramify-agent

# Readline and shell defaults.
RUN echo 'set enable-bracketed-paste off' >> /home/app/.inputrc && \
    echo 'set editing-mode emacs' >> /home/app/.inputrc && \
    echo '"\e[A": history-search-backward' >> /home/app/.inputrc && \
    echo '"\e[B": history-search-forward' >> /home/app/.inputrc && \
    echo 'set show-all-if-ambiguous on' >> /home/app/.inputrc && \
    echo 'set completion-ignore-case on' >> /home/app/.inputrc && \
    echo 'export TERM=xterm-256color' >> /home/app/.bashrc && \
    echo 'export HISTSIZE=50000' >> /home/app/.bashrc && \
    echo 'export HISTFILESIZE=50000' >> /home/app/.bashrc && \
    echo 'shopt -s histappend' >> /home/app/.bashrc && \
    echo 'alias yolo="claude --dangerously-skip-permissions"' >> /home/app/.bashrc && \
    echo 'alias yolo-codex="codex --full-auto"' >> /home/app/.bashrc

RUN echo '# Terminal settings' >> /home/app/.zshrc && \
    echo 'export TERM=xterm-256color' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# History configuration' >> /home/app/.zshrc && \
    echo 'HISTFILE=~/.zsh_history' >> /home/app/.zshrc && \
    echo 'HISTSIZE=50000' >> /home/app/.zshrc && \
    echo 'SAVEHIST=50000' >> /home/app/.zshrc && \
    echo 'setopt APPEND_HISTORY' >> /home/app/.zshrc && \
    echo 'setopt SHARE_HISTORY' >> /home/app/.zshrc && \
    echo 'setopt HIST_IGNORE_DUPS' >> /home/app/.zshrc && \
    echo 'setopt HIST_FIND_NO_DUPS' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# Key bindings (vi mode with arrow keys)' >> /home/app/.zshrc && \
    echo 'bindkey -v' >> /home/app/.zshrc && \
    echo 'bindkey "^[[A" history-beginning-search-backward' >> /home/app/.zshrc && \
    echo 'bindkey "^[[B" history-beginning-search-forward' >> /home/app/.zshrc && \
    echo 'bindkey "^R" history-incremental-search-backward' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# Completion settings' >> /home/app/.zshrc && \
    echo 'autoload -Uz compinit && compinit' >> /home/app/.zshrc && \
    echo 'zstyle ":completion:*" matcher-list "m:{a-z}={A-Za-z}"' >> /home/app/.zshrc && \
    echo 'zstyle ":completion:*" menu select' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# Load syntax highlighting and autosuggestions' >> /home/app/.zshrc && \
    echo '[ -f /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ] && source /usr/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh' >> /home/app/.zshrc && \
    echo '[ -f /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh ] && source /usr/share/zsh-autosuggestions/zsh-autosuggestions.zsh' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# Prompt' >> /home/app/.zshrc && \
    echo 'PROMPT="%F{cyan}%n@%m%f:%F{blue}%~%f$ "' >> /home/app/.zshrc && \
    echo '' >> /home/app/.zshrc && \
    echo '# Aliases' >> /home/app/.zshrc && \
    echo 'alias yolo="claude --dangerously-skip-permissions"' >> /home/app/.zshrc && \
    echo 'alias yolo-codex="codex --full-auto"' >> /home/app/.zshrc

# Development CLIs at pinned versions. Startup checks these versions and never
# updates them; change a pin here and rebuild the image.
# Pi is not installed globally: it is the agent's own pinned dependency
# (`npx pi` from the agent checkout).
ARG CLAUDE_CODE_VERSION=2.1.289
ARG CODEX_VERSION=0.161.0
ARG PLAYWRIGHT_MCP_VERSION=0.0.83
RUN sudo env PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -g \
    @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
    @openai/codex@${CODEX_VERSION} \
    @playwright/mcp@${PLAYWRIGHT_MCP_VERSION}
ENV CLAUDE_CODE_VERSION=${CLAUDE_CODE_VERSION} \
    CODEX_VERSION=${CODEX_VERSION} \
    PLAYWRIGHT_MCP_VERSION=${PLAYWRIGHT_MCP_VERSION} \
    DISABLE_AUTOUPDATER=1

ENV NODE_ENV=development

# Chromium configuration for headless operation in the container.
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMIUM_FLAGS="--no-sandbox --disable-dev-shm-usage --disable-gpu"

# Agent server (npm run serve) and web development server (npm run dev:web).
EXPOSE 4180 5181

CMD ["/bin/zsh"]
