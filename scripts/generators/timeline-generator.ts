import { generateTimelineComplete } from './unified-pipeline';
import { saveTimelineFromContext } from './save-timeline-content';
import type { TimelineSeed } from '@/lib/generation/types';
import { summarizeError, serializeError } from '../utils/error';

/**
 * Generate and save a complete timeline using unified pipeline
 */
export async function generateTimeline(seed: TimelineSeed): Promise<{
  success: boolean;
  timelineId?: string;
  error?: string;
}> {
  try {
    console.log(`\n📜 Generating timeline: ${seed.title}`);
    console.log(`   Period: ${seed.startYear} - ${seed.endYear}`);

    // Use unified pipeline for all generation
    const context = await generateTimelineComplete(seed);

    // Save to database
    console.log('   💾 Saving to database...');
    const { timelineId, isNew } = await saveTimelineFromContext(context);

    console.log(
      isNew
        ? `   ✅ Timeline created: ${timelineId}`
        : `   🔄 Timeline updated: ${timelineId}`
    );

    return {
      success: true,
      timelineId,
    };
  } catch (error) {
    const message = summarizeError(error);
    console.error(`   ❌ Error generating timeline: ${message}`);

    const details = serializeError(error);
    if (details) {
      console.error('   ℹ️  Full error details:', details);
    }

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Generate multiple timelines in batch
 */
export async function generateTimelines(
  seeds: TimelineSeed[],
  options?: {
    delayMs?: number;
    onProgress?: (current: number, total: number) => void;
  }
): Promise<Array<{ seed: TimelineSeed; result: any }>> {
  const results: Array<{ seed: TimelineSeed; result: any }> = [];
  const delayMs = options?.delayMs || 1000; // Rate limiting

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];

    if (options?.onProgress) {
      options.onProgress(i + 1, seeds.length);
    }

    const result = await generateTimeline(seed);
    results.push({ seed, result });

    // Delay between requests to avoid rate limits
    if (i < seeds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
