import { useEffect, useRef } from "react";
import { print } from "graphql";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { getWsClient } from "./ws.js";

export function useSubscription<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables: TVariables,
  onNext: (data: TResult) => void,
  enabled = true,
): void {
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const variablesKey = JSON.stringify(variables);

  useEffect(() => {
    if (!enabled) return;
    const client = getWsClient();
    const dispose = client.subscribe(
      { query: print(document), variables: variables as Record<string, unknown> },
      {
        next: (msg) => {
          if (msg.data) onNextRef.current(msg.data as TResult);
        },
        error: console.error,
        complete: () => {},
      },
    );
    return () => dispose();
    // document is a compile-time constant; variables tracked via JSON key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, variablesKey]);
}
