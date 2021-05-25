import { hyperStyled } from "@macrostrat/hyper";
import { useRef, useMemo, useEffect, useState } from "react";
import { useAPIHelpers } from "@macrostrat/ui-components";
import { APIV2Context, useAPIv2Result } from "~/api-v2";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { MinimalNavbar } from "~/components";
import { Button, ButtonGroup, Menu, MenuItem } from "@blueprintjs/core";
import styles from "./module.styl";

const h = hyperStyled(styles);

const statusOptions = {
  [ReadyState.CONNECTING]: "Connecting",
  [ReadyState.OPEN]: "Open",
  [ReadyState.CLOSING]: "Closing",
  [ReadyState.CLOSED]: "Closed",
  [ReadyState.UNINSTANTIATED]: "Uninstantiated",
};

function ImporterMain({ pipeline = "laserchron-data" }) {
  const helpers = useAPIHelpers(APIV2Context);
  //const url = helpers.buildURL("/import-tracker");
  const url = `ws://localhost:5002/api/v2/import-tracker/pipeline/${pipeline}`;

  const { sendMessage, lastMessage, readyState } = useWebSocket(url, {
    onOpen: () => console.log("opened"),
  });
  const messageHistory = useRef([]);
  const [isRunning, setIsRunning] = useState(false);

  const connectionStatus = statusOptions[readyState];

  messageHistory.current = useMemo(() => {
    return messageHistory.current?.concat(lastMessage);
  }, [lastMessage]);

  return h("div.importer-main", [
    h(MinimalNavbar, [
      h("h3", pipeline),
      h(ButtonGroup, { minimal: true }, [
        h(
          Button,
          {
            rightIcon: isRunning ? "stop" : "play",
            onClick() {
              console.log("Sending message");
              sendMessage(
                JSON.stringify({ action: isRunning ? "stop" : "start" })
              );
            },
          },
          isRunning ? "Stop" : "Start"
        ),
      ]),
    ]),
    h("div.status", "WebSocket connection: " + connectionStatus),
    h(
      "div.message-history",
      messageHistory.current?.map((d) => {
        if (d == null) return null;
        return h("div.message", d.data);
      })
    ),
  ]);
}

function PipelinesList() {
  const pipelines: any[] | null = useAPIv2Result("/import-tracker/pipelines");

  return h("div.pipelines-list", [
    h("h3", "Pipelines"),
    h(
      Menu,
      (pipelines ?? []).map((d) => h(MenuItem, { text: d }))
    ),
  ]);
}

function ImporterPage() {
  return h("div.importer-page", [
    h("div.left-column", null, h(PipelinesList)),
    h(ImporterMain),
  ]);
}

export default ImporterPage;
