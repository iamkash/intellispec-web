/**
 * Detail Cards Component
 * Container component that handles data fetching and orchestration
 * Delegates presentation to child components
 *
 * ✅ OPTIMIZATION: Uses shared document cache to prevent duplicate fetches
 */

import React from "react";
import { GadgetContext } from "../../base";
import { DetailCard } from "./components/DetailCard";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { LoadingState } from "./components/LoadingState";
import { DEFAULT_LABELS } from "./constants";
import { useSharedDocument } from "../TimelineGadget/hooks/useSharedDocument";
import { DetailCardsGadgetConfig } from "./types";
import styles from "./DetailCardsGadget.module.css";

interface DetailCardsComponentProps {
  config: DetailCardsGadgetConfig;
  context?: GadgetContext;
}

export const DetailCardsComponent: React.FC<DetailCardsComponentProps> =
  React.memo(({ config, context }) => {
    // ✅ CRITICAL OPTIMIZATION: Use shared document cache
    // Prevents duplicate fetches when multiple gadgets need the same document
    const { data, loading, error } = useSharedDocument({
      dataUrl: config.dataUrl,
      dataPath: config.dataPath,
      context,
    });

    const labels = { ...DEFAULT_LABELS, ...(config.labels || {}) };

    console.log("[DetailCardsComponent] Render:", {
      loading,
      error,
      hasData: !!data,
      dataKeys: data ? Object.keys(data).slice(0, 5) : [],
    });

    // Loading state
    if (loading) {
      return <LoadingState />;
    }

    // Error state
    if (error) {
      return <ErrorState message={error} />;
    }

    // Empty state
    if (!data) {
      return <EmptyState message={labels.emptyState} />;
    }

    // Render cards
    return (
      <div className={styles.cardsGrid}>
        {config.cards.map((card) => (
          <DetailCard key={card.id} card={card} data={data} />
        ))}
      </div>
    );
  });

DetailCardsComponent.displayName = "DetailCardsComponent";
