import type {
  GenerationContext,
  ResearchCorpus,
  TimelineSeed,
} from './types';

function stringifyCorpus(researchCorpus?: ResearchCorpus) {
  return researchCorpus ? JSON.stringify(researchCorpus, null, 2) : '';
}

function describeSeed(seed: TimelineSeed) {
  const { title, startYear, endYear, region, context } = seed;
  return `${title} (${startYear} to ${endYear}${region ? `, ${region}` : ''})${context ? `\n\nBackground context: ${context}` : ''}`;
}

export function buildPhase1ResearchPrompt(seed: TimelineSeed) {
  const { title, startYear, endYear, region, context } = seed;
  return `You are a historical researcher preparing a comprehensive research corpus for: "${title}" (${startYear} to ${endYear}${region ? `, ${region}` : ''})

${context ? `Background context: ${context}` : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Conduct thorough research to build a factual foundation that will support all content generation. Use web search to find authoritative sources.

RESEARCH PRIORITIES:
1. PRIMARY SOURCES first (ancient historians, contemporary documents, archaeological evidence)
2. SCHOLARLY SOURCES second (peer-reviewed papers, university press books)
3. AUTHORITATIVE REFERENCES third (Britannica, major encyclopedias)

WHAT TO GATHER:
• Key dates and their sources
• Important figures and their documented roles
• Pivotal events with specific details (numbers, places, outcomes)
• Direct quotes from primary sources
• Scholarly interpretations and debates
• Concrete data (army sizes, casualties, distances, durations)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:

{
  "digest": "800-1200 word research summary organized by topic. Include specific facts, dates, names, and numbers. Reference citations as [1], [2], etc.",
  
  "citations": [
    {
      "number": 1,
      "source": "Full source citation (e.g., 'Polybius, Histories, Book 3')",
      "url": "URL if available",
      "type": "primary|secondary|modern",
      "reliability": "high|medium|low"
    }
  ],
  
  "keyQuotes": [
    {
      "text": "Exact quote from source",
      "citationNumber": 1,
      "context": "When/why this quote is significant"
    }
  ],
  
  "keyDataPoints": [
    "Specific fact with citation, e.g., 'Roman losses at Cannae: ~50,000-70,000 [3]'",
    "Another specific fact with citation"
  ],
  
  "primarySourcesFound": [
    "List of primary sources discovered (Polybius, Livy, inscriptions, etc.)"
  ]
}

═══════════════════════════════════════════════════════════════════════════════
RESEARCH STANDARDS
═══════════════════════════════════════════════════════════════════════════════

• Aim for 15-25 citations from diverse sources
• Prioritize sources that provide SPECIFIC DETAILS (dates, numbers, names)
• For ancient history: Polybius > Livy > later sources (note reliability differences)
• Include at least 5-8 direct quotes that could be used in content
• Note any scholarly debates or uncertainties
• Verify key facts across multiple sources when possible

Your research corpus will be used by all subsequent content generation phases, so thoroughness and accuracy are critical.`;
}

export function buildPhase2SkeletonPrompt(seed: TimelineSeed, researchCorpus: ResearchCorpus) {
  const { title, startYear, endYear } = seed;
  return `You are creating the factual skeleton for a timeline about: "${title}" (${startYear} to ${endYear})

═══════════════════════════════════════════════════════════════════════════════
RESEARCH CORPUS (use this as your source of truth)
═══════════════════════════════════════════════════════════════════════════════

${JSON.stringify(researchCorpus, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Create a FACTUAL SKELETON that establishes:
1. WHAT events happened and WHEN
2. WHO the key figures were
3. WHAT themes connect the events

This skeleton will be expanded into full prose in later phases. Your job here is CLARITY and ACCURACY, not literary style.

═══════════════════════════════════════════════════════════════════════════════
EVENTS (generate 18-24 events)
═══════════════════════════════════════════════════════════════════════════════

For each event, provide:

{
  "title": "Clear, specific title (e.g., 'Battle of Cannae' not 'A Great Battle')",
  "year": -216,  // Use negative for BCE
  "endYear": null,  // Only if event spans multiple years
  "oneSentence": "Hannibal's double envelopment destroyed eight Roman legions, killing approximately 50,000-70,000 soldiers in a single day.",
  "keyFacts": [
    "Roman force: ~86,000 infantry and cavalry [3]",
    "Roman dead: 50,000-70,000 (Polybius) [1]",
    "Hannibal's force: ~50,000 [3]",
    "Largest defeat in Roman history to that date [4]"
  ],
  "citationsToUse": [1, 3, 4],
  "importance": 3,  // 1=notable, 2=significant, 3=major turning point
  "type": "battle",
  "category": "Military Conflict"
}

CRITICAL REQUIREMENTS FOR EVENTS:
• "oneSentence" must answer: What happened? When? What was the outcome?
• "keyFacts" must include SPECIFIC numbers, names, or verifiable details
• Every fact must reference a citation number from the research corpus
• Distribute events across the full timeline (don't cluster)
• Include a MIX of military, political, diplomatic, and cultural events

═══════════════════════════════════════════════════════════════════════════════
PEOPLE (generate 8-12 key figures)
═══════════════════════════════════════════════════════════════════════════════

{
  "name": "Hannibal Barca",
  "birthYear": -247,
  "deathYear": -183,
  "role": "Carthaginian General and Strategist",
  "oneSentence": "Carthaginian commander who invaded Italy via the Alps and won devastating victories at Trebia, Lake Trasimene, and Cannae before his eventual defeat at Zama.",
  "keyFacts": [
    "Crossed the Alps with ~50,000 troops and 37 elephants [2]",
    "Undefeated in Italy for 15 years [5]",
    "Defeated at Zama in 202 BCE by Scipio Africanus [1]"
  ],
  "citationsToUse": [1, 2, 5],
  "relatedEvents": ["Crossing of the Alps", "Battle of Cannae", "Battle of Zama"]
}

CRITICAL REQUIREMENTS FOR PEOPLE:
• Use null (not "Unknown" or "c.") for uncertain dates
• "oneSentence" must establish: Who were they? What did they do? Why do they matter?
• Include people from BOTH/ALL sides of conflicts
• Include non-military figures where relevant (politicians, diplomats)

═══════════════════════════════════════════════════════════════════════════════
THEMES (generate 3-5 themes)
═══════════════════════════════════════════════════════════════════════════════

{
  "id": "naval-adaptation",
  "title": "Rome's Naval Transformation",
  "oneSentence": "Rome evolved from a land power with no navy to Mediterranean naval dominance within a single generation.",
  "relatedEvents": ["Battle of Mylae", "Battle of Ecnomus", "Battle of the Aegates Islands"]
}

═══════════════════════════════════════════════════════════════════════════════
PERIODIZATION
═══════════════════════════════════════════════════════════════════════════════

Break the timeline into logical periods for navigation:

{
  "name": "First Punic War",
  "startYear": -264,
  "endYear": -241,
  "eventCount": 6
}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return a single JSON object:

{
  "events": [...],
  "people": [...],
  "themes": [...],
  "periodization": [...]
}`;
}

export function buildPhase3NarrativePrompt(context: GenerationContext) {
  const { seed, researchCorpus, skeleton } = context;
  if (!researchCorpus || !skeleton) {
    throw new Error('Missing research corpus or skeleton for narrative prompt');
  }

  const { title, startYear, endYear } = seed;
  return `You are crafting the main narrative content for a timeline about: "${title}" (${startYear} to ${endYear})

═══════════════════════════════════════════════════════════════════════════════
CONTEXT FROM PREVIOUS PHASES
═══════════════════════════════════════════════════════════════════════════════

RESEARCH CORPUS:
${stringifyCorpus(researchCorpus)}

SKELETON (events, people, themes already established):
${JSON.stringify(skeleton, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Create the main narrative content that will appear at the TOP of the timeline page, BEFORE readers see the detailed event list. This content must ORIENT readers—tell them what they're about to learn, who the key players are, and why it matters.

... (prompt continues per brief, include requirements for overview, summary, and themes) ...`;
}

export function buildPhase4EventsPrompt(context: GenerationContext, eventsChunk: any[]) {
  if (!context.researchCorpus || !context.mainNarrative) {
    throw new Error('Missing context for event expansion');
  }

  return `You are expanding skeleton events into full narrative content for: "${describeSeed(context.seed)}"

═══════════════════════════════════════════════════════════════════════════════
CONTEXT FROM PREVIOUS PHASES
═══════════════════════════════════════════════════════════════════════════════

RESEARCH CORPUS (your source for facts and citations):
${stringifyCorpus(context.researchCorpus)}

MAIN NARRATIVE (themes and overview for consistency):
${JSON.stringify(context.mainNarrative, null, 2)}

EVENTS TO EXPAND:
${JSON.stringify(eventsChunk, null, 2)}

... (expansion instructions per brief) ...`;
}

export function buildPhase4RecapPrompt(context: GenerationContext) {
  if (!context.expandedEvents || !context.mainNarrative) {
    throw new Error('Missing expanded events or narrative for recap');
  }

  const { title, startYear, endYear } = context.seed;
  return `You are creating a Storyform Recap that synthesizes: "${title}" (${startYear} to ${endYear})

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

This recap appears AFTER the detailed timeline on the page. Readers have already scrolled through all the events, so you can assume familiarity with the major moments. Your job is to weave them into a cohesive narrative arc.

EXPANDED EVENTS (these are what readers just saw):
${JSON.stringify(
    context.expandedEvents.map(e => ({ title: e.title, year: e.year, slug: e.slug, summary: e.summary })),
    null,
    2
  )}

THEMES (from main narrative):
${JSON.stringify(context.mainNarrative.themes, null, 2)}

... (recap instructions per brief) ...`;
}

export function buildPhase5EnrichmentPrompt(context: GenerationContext) {
  if (!context.researchCorpus || !context.skeleton || !context.mainNarrative || !context.expandedEvents) {
    throw new Error('Missing context for enrichment prompt');
  }

  return `You are generating enrichment content for: "${describeSeed(context.seed)}"

═══════════════════════════════════════════════════════════════════════════════
FULL CONTEXT
═══════════════════════════════════════════════════════════════════════════════

RESEARCH CORPUS:
${stringifyCorpus(context.researchCorpus)}

SKELETON (people to expand):
${JSON.stringify(context.skeleton, null, 2)}

MAIN NARRATIVE:
${JSON.stringify(context.mainNarrative, null, 2)}

EXPANDED EVENTS:
${JSON.stringify(context.expandedEvents.map(e => ({ title: e.title, slug: e.slug, year: e.year })), null, 2)}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT SCOPE (RETURN JSON ONLY)
═══════════════════════════════════════════════════════════════════════════════

Return a single JSON object with these arrays:
- people (expanded bios, keep historical accuracy)
- turningPoints (explain before/after)
- perspectives (expanded lenses with citations)
- themeInsights (deep analysis per theme)
- keyFacts (concise factoids, each may include citations)

Use citation numbers that match the research corpus. Include the citation numbers used in each element so they can be rendered.

═══════════════════════════════════════════════════════════════════════════════
THEME INSIGHTS (one per theme) - EXPANDED AND ANALYTICAL
═══════════════════════════════════════════════════════════════════════════════

For each theme in the main narrative, provide a DEEPER ANALYTICAL INSIGHT (not just a summary):

{
  "themeId": "naval-adaptation",
  "insight": "2-3 sentences explaining the MECHANISM of this theme. Include specific examples with citations. What pattern does this exemplify? What made it work or fail?",
  "analysis": "3-4 sentences going DEEPER. What does the evidence actually show? Are there scholarly debates? What would a historian emphasize? Include citations.",
  "modernRelevance": "1-2 sentences (optional) connecting this pattern to contemporary parallels or why it matters today",
  "supportingEvents": ["event-slug-1", "event-slug-2"],
  "citations": [1, 3, 7]
}

REQUIREMENTS:
• Each theme insight should be 150-250 words total (insight + analysis)
• Include at least 2-3 citations
• Reference specific events and data points
• Explain MECHANISMS not just descriptions
• Note scholarly debates where relevant

Example:
{
  "themeId": "naval-adaptation",
  "insight": "Rome's transformation from a land power with no navy to Mediterranean naval dominance within 25 years (264-241 BCE) illustrates the Republic's capacity for institutional innovation under existential threat. The corvus boarding bridge [1] didn't just neutralize Carthage's naval expertise—it fundamentally redefined naval warfare by turning sea battles into the infantry combat where Rome excelled [3].",
  "analysis": "What's remarkable isn't the technical innovation alone but the speed and scale of implementation. Rome built approximately 330 quinqueremes between 261 and 241 BCE [7], trained crews with minimal maritime tradition, and accepted catastrophic losses (nearly 700 ships lost to storms [3]) without abandoning the strategy. This suggests a political and economic system capable of absorbing massive costs for long-term strategic goals—a pattern that would define Rome's approach to Hannibal's invasion a generation later.",
  "modernRelevance": "The pattern of rapid technological adoption during wartime—learning enemy innovations, adapting them to existing strengths, and accepting high initial costs—has parallels in 20th century conflicts from radar development to nuclear programs.",
  "supportingEvents": ["romes-first-naval-victory-at-mylae", "battle-of-ecnomus", "battle-of-aegates-islands"],
  "citations": [1, 3, 7]
}

═══════════════════════════════════════════════════════════════════════════════
PERSPECTIVES (2-4 viewpoints) - EXPANDED
═══════════════════════════════════════════════════════════════════════════════

Provide different interpretive lenses on this period. Each perspective should be 100-150 words:

{
  "viewpoint": "Roman Sources vs. Modern Archaeology",
  "summary": "2-3 sentences introducing this interpretive lens",
  "keyArguments": [
    "Specific argument point 1 with evidence [1]",
    "Specific argument point 2 with evidence [3]",
    "Specific argument point 3 with evidence [7]"
  ],
  "tensions": "1-2 sentences on debates or contradictions in this viewpoint",
  "citations": [1, 3, 7]
}

REQUIRED PERSPECTIVES:
1. Source Critical: How do our sources shape/limit what we know?
2. Modern Historiography: How have interpretations changed over time?
3. (Optional) Comparative: How does this compare to similar periods/places?
4. (Optional) Counterfactual: What if key moments had gone differently?

Each perspective should cite specific evidence and acknowledge scholarly debates.`;
}

export function buildPhase6SEOPrompt(context: GenerationContext) {
  if (!context.mainNarrative || !context.expandedEvents || !context.enrichment) {
    throw new Error('Missing content for SEO prompt');
  }

  const { title, startYear, endYear } = context.seed;
  return `Generate SEO metadata for: "${title}" (${startYear} to ${endYear})

═══════════════════════════════════════════════════════════════════════════════
CONTENT SUMMARY
═══════════════════════════════════════════════════════════════════════════════

PAGE TITLE: ${context.mainNarrative.pageTitle}
SUMMARY: ${context.mainNarrative.summary}
THEMES: ${context.mainNarrative.themes.map(t => t.title).join(', ')}
KEY EVENTS: ${context.expandedEvents.slice(0, 5).map(e => e.title).join(', ')}
KEY PEOPLE: ${context.enrichment.people.slice(0, 5).map(p => p.name).join(', ')}

... (SEO instructions per brief) ...`;
}
