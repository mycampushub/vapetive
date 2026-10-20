#!/bin/bash
# Resilient dev-server keeper: restarts bun run dev whenever :3000 stops
# responding. Runs detached; logs restarts to /tmp/vapetive-keeper.log.
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null http://localhost:3000 --max-time 4; then
    echo "[$(date '+%H:%M:%S')] :3000 down — starting dev server" >> /tmp/vapetive-keeper.log
    bun run dev >> /tmp/vapetive-keeper.log 2>&1 &
    DEVPID=$!
    # Wait for it to come up (max 60s)
    for i in $(seq 1 30); do
      sleep 2
      if curl -s -o /dev/null http://localhost:3000 --max-time 3; then break; fi
    done
  fi
  sleep 15
done
