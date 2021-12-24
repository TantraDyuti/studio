// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { Dialog, Overlay, Stack, useTheme } from "@fluentui/react";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import Snow from "@foxglove/studio-base/Snow";
import {
  IDataSourceFactory,
  usePlayerSelection,
} from "@foxglove/studio-base/context/PlayerSelectionContext";

import Connection from "./Connection";
import Remote from "./Remote";
import Start from "./Start";
import { OpenDialogViews } from "./types";
import { useOpenFile } from "./useOpenFile";

type OpenDialogProps = {
  activeView?: OpenDialogViews;
  activeDataSource?: IDataSourceFactory;
  onDismiss?: () => void;
};

export default function OpenDialog(props: OpenDialogProps): JSX.Element {
  const { activeView: defaultActiveView, onDismiss, activeDataSource } = props;
  const { availableSources, selectSource } = usePlayerSelection();

  const [activeView, setActiveView] = useState<OpenDialogViews>(defaultActiveView ?? "start");
  const theme = useTheme();

  const openFile = useOpenFile(availableSources);

  const firstSampleSource = useMemo(() => {
    return availableSources.find((source) => source.type === "sample");
  }, [availableSources]);

  useLayoutEffect(() => {
    setActiveView(defaultActiveView ?? "start");
  }, [defaultActiveView]);

  const onSelectView = useCallback((view: OpenDialogViews) => {
    setActiveView(view);
  }, []);

  useLayoutEffect(() => {
    if (activeView === "file") {
      openFile().catch((err) => {
        console.error(err);
      });
    } else if (activeView === "demo" && firstSampleSource) {
      selectSource(firstSampleSource.id);
    }
  }, [activeView, firstSampleSource, openFile, selectSource]);

  const allExtensions = useMemo(() => {
    return availableSources.reduce((all, source) => {
      if (!source.supportedFileTypes) {
        return all;
      }

      return [...all, ...source.supportedFileTypes];
    }, [] as string[]);
  }, [availableSources]);

  // connectionSources is the list of availableSources supporting "connections"
  const connectionSources = useMemo(() => {
    return availableSources.filter((source) => {
      return source.type === "connection" && source.hidden !== true;
    });
  }, [availableSources]);

  const remoteFileSources = useMemo(() => {
    return availableSources.filter((source) => source.type === "remote-file");
  }, [availableSources]);

  const view = useMemo(() => {
    switch (activeView) {
      case "demo": {
        return {
          title: "",
          component: <></>,
        };
      }
      case "connection":
        return {
          title: "Open new connection",
          component: (
            <Connection
              onBack={() => onSelectView("start")}
              onCancel={onDismiss}
              availableSources={connectionSources}
              activeSource={activeDataSource}
            />
          ),
        };
      case "remote":
        return {
          title: "Open a file from a remote location",
          component: (
            <Remote
              onBack={() => onSelectView("start")}
              onCancel={onDismiss}
              availableSources={remoteFileSources}
            />
          ),
        };
      default:
        return {
          title: "Get started",
          component: <Start onSelectView={onSelectView} supportedFileExtensions={allExtensions} />,
        };
    }
  }, [
    activeDataSource,
    activeView,
    allExtensions,
    connectionSources,
    onDismiss,
    onSelectView,
    remoteFileSources,
  ]);

  let snowType: "snow" | "confetti" | undefined;
  const now = new Date();
  if (now >= new Date(2022, 0, 2)) {
    snowType = undefined;
  } else if (now >= new Date(2022, 0, 1)) {
    snowType = "confetti";
  } else if (now > new Date(2021, 11, 25)) {
    snowType = "snow";
  }

  return (
    <>
      {snowType && (
        <Overlay isDarkThemed onClick={onDismiss} style={{ zIndex: 100000 }}>
          <Snow type={snowType} />
        </Overlay>
      )}
      <Dialog
        hidden={false}
        maxWidth={800}
        minWidth={800}
        modalProps={{
          isModeless: snowType != undefined,
          layerProps: {
            // We enable event bubbling so a user can drag&drop files or folders onto the app even when
            // the dialog is shown.
            eventBubblingEnabled: true,
          },
          overlay: {
            styles: snowType ? { root: { display: "none" } } : undefined,
          },
          styles: {
            main: {
              display: "flex",
              flexDirection: "column",
            },
            scrollableContent: {
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
        onDismiss={onDismiss}
        dialogContentProps={{
          showCloseButton: true,
          title: view.title,
          styles: {
            content: {
              overflow: "hidden",
              height: 480,
              display: "flex",
              flexDirection: "column",
              padding: theme.spacing.l1,

              "@media (max-height: 512px)": { overflowY: "auto" },
            },
            inner: {
              flex: 1,
              display: "flex",
              flexDirection: "column",

              "@media (min-height: 512px)": { overflow: "hidden" },
            },
            innerContent: {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              flex: 1,

              "@media (min-height: 512px)": { overflow: "hidden" },
            },
          },
        }}
      >
        <Stack
          grow
          verticalFill
          verticalAlign="space-between"
          tokens={{ childrenGap: theme.spacing.m }}
        >
          {view.component}
        </Stack>
      </Dialog>
    </>
  );
}
