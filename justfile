environment := "local"

up env=environment:
  ENV={{env}} docker compose -f compose.yml up -d

down:
  docker compose -f compose.yml down
