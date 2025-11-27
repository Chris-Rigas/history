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

CRITICAL: You must gather BOTH primary/original sources AND modern web-accessible sources. This serves dual purposes:
1. Historical authenticity (original texts, contemporary accounts, primary documents)
2. SEO and accessibility (modern scholarly articles, authoritative websites with URLs)

═══════════════════════════════════════════════════════════════════════════════
SOURCE REQUIREMENTS (15-25 TOTAL CITATIONS)
═══════════════════════════════════════════════════════════════════════════════

**TARGET MIX:**
- 40-50% PRIMARY/ORIGINAL SOURCES (contemporary documents, original texts)
- 30-40% MODERN SCHOLARLY WEB SOURCES (with URLs)
- 20-30% AUTHORITATIVE REFERENCE SOURCES (with URLs)

**PRIMARY/ORIGINAL SOURCES (6-10 citations):**
Contemporary accounts, original documents, primary texts relevant to the period. These may include historical chronicles, letters, treaties, inscriptions, archaeological findings, or other first-hand evidence.

Format: "Author/Source Name, Title/Description" (URL optional)
Note: Many primary sources won't have direct URLs — this is expected and acceptable

**MODERN SCHOLARLY WEB SOURCES (5-8 citations) — MUST HAVE URLS:**
Credible modern scholarly resources available on the web. Use your judgment to find authoritative sources appropriate to the topic.

Prioritize: University websites, museum collections, digital libraries, peer-reviewed journals online, respected historical/scholarly organizations, government archives

**AUTHORITATIVE REFERENCES (4-7 citations) — MUST HAVE URLS:**
Major encyclopedias, reference works, and educational resources with strong editorial standards.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this structure:

{
  "digest": "800-1200 word research summary organized by topic. Include specific facts, dates, names, and numbers. Reference citations as [1], [2], etc.",
  
  "citations": [
    {
      "number": 1,
      "source": "Full source citation",
      "url": "https://... (REQUIRED for modern/reference sources, optional for primary)",
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
    "Specific fact with citation, e.g., 'Three Roman legions destroyed [3]'",
    "Another specific fact with citation"
  ],
  
  "primarySourcesFound": [
    "List of primary sources discovered"
  ]
}

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

✓ At least 60% of citations MUST have working URLs
✓ Balance primary sources with modern scholarly analysis
✓ Include at least 5-8 direct quotes from primary/original sources
✓ Verify key facts across multiple sources when possible
✓ Prioritize authoritative domains over commercial sites

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
THEME INSIGHTS (3-4 themes ONLY) - SUBSTANTIVE AND SPECIFIC
═══════════════════════════════════════════════════════════════════════════════

Generate exactly 3-4 theme insights that capture the most important patterns or dynamics 
of this period. Quality over quantity—each theme should be substantive and well-developed.

STRUCTURE FOR EACH THEME:

{
  "themeId": "descriptive-kebab-case-id",
  "title": "Clear, Specific Title (Not Generic)",
  "insight": "Opening paragraph explaining the pattern/dynamic (100-150 words)",
  "analysis": "Deeper analytical paragraph with specific evidence (150-250 words)",
  "supportingEvents": ["event-slug-1", "event-slug-2"],
  "citations": [1, 3, 7]
}

═══════════════════════════════════════════════════════════════════════════════
MANDATORY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

QUANTITY:
• Generate EXACTLY 3-4 themes (not 5, not 6)
• Total word count per theme: 250-400 words (insight + analysis combined)
• Each theme must stand alone as a substantial analytical piece

SPECIFICITY (each theme must include at least 2 of these 3):
• NAMES: Specific people, places, or institutions (e.g., "Decius", "Abritus", "Rhine frontier")
• DATES: Specific years, spans, or timeframes (e.g., "251 CE", "235-284", "within 15 years")
• NUMBERS: Quantities, percentages, or measurements (e.g., "26 emperors", "50 denarii", "doubled from previous century")

SUBSTANCE:
• Avoid vague titles like "Crisis and Response" or "Change and Continuity"
• Instead use specific framing: "When Emperors Became Battlefield Commanders" or "The Collapse of Silver Currency"
• Make patterns concrete: don't just say "military pressure increased"—explain HOW and show the SCALE
• Connect evidence to argument: "This shows..." "The result was..." "The evidence suggests..."

ANALYTICAL DEPTH:
• Explain mechanisms and causes, not just descriptions
• Show what changed and why it mattered
• Connect to other events in the timeline
• Patterns are fine—just make sure they're substantiated with specific details

═══════════════════════════════════════════════════════════════════════════════
WHAT TO AVOID
═══════════════════════════════════════════════════════════════════════════════

❌ Generic patterns without specifics:
   "External pressures reshaped Roman priorities"
   
✅ Specific patterns with evidence:
   "Persian victories at Edessa (260) and Carrhae forced Rome to maintain 30,000+ troops 
   on the eastern frontier—triple the garrison of the previous century"

❌ Vague temporal markers:
   "Over time, the situation worsened"
   
✅ Precise timeframes:
   "Between 249 and 251, three emperors died in rapid succession"

❌ Abstract causation:
   "Military challenges created instability"
   
✅ Concrete mechanisms:
   "When Decius fell at Abritus in 251—the first emperor killed by foreign enemies—
   it shattered the assumption that emperors died in Roman political struggles, 
   not barbarian battlefields"

═══════════════════════════════════════════════════════════════════════════════
EXAMPLE (Crisis of the Third Century)
═══════════════════════════════════════════════════════════════════════════════

{
  "themeId": "emperor-as-soldier",
  "title": "From Political Authority to Military Survival",
  "insight": "The Crisis fundamentally transformed what it meant to be emperor. Before 235, emperors might campaign but ruled primarily from Rome, managing the Senate and urban politics. After Maximinus Thrax (235-238)—a career soldier who never visited Rome during his reign—every emperor had to be a battlefield commander first. The question wasn't whether an emperor would lead armies, but where he would die: in civil war or defending the frontiers. Between 235 and 284, at least 18 of the 26 emperors died violently, and several—like Decius (251) and Valerian (260)—died fighting foreign enemies rather than Roman rivals.",
  "analysis": "This shift had cascading consequences for Roman governance. Emperors spent years on campaign along the Rhine and Danube, making the Senate increasingly irrelevant to real decision-making. The praetorian prefect evolved from a ceremonial bodyguard commander to a de facto deputy emperor managing logistics and provincial administration. Meanwhile, frontier armies gained unprecedented power—they could make and unmake emperors based on battlefield performance alone. Philip the Arab (244-249) exemplified this: his authority rested entirely on military success, and when he struggled against Gothic invasions, his troops proclaimed Decius emperor at the first major defeat. The pattern repeated throughout the period: emperors rose and fell based on their ability to win battles, not their political acumen or legitimacy. This created a feedback loop where only military men could become emperor, but being emperor meant constant warfare until death. By the time Diocletian stabilized the empire (284), the civilian emperor of Augustus' model was extinct—replaced by a permanent military autocracy.",
  "supportingEvents": ["maximinus-thrax-proclaimed", "battle-of-abritus", "valerian-captured", "aurelian-reforms"],
  "citations": [12, 15, 23, 31]
}

═══════════════════════════════════════════════════════════════════════════════
SELECTION CRITERIA
═══════════════════════════════════════════════════════════════════════════════

Choose themes that:
1. Capture genuinely important dynamics (not minor trends)
2. Have clear supporting evidence across multiple events
3. Help explain WHY this period unfolded as it did
4. Complement each other (don't repeat the same point 4 times)
5. Balance different aspects: political, military, economic, social, cultural

If you're choosing between 5 possible themes, pick the 3-4 that:
- Have the most concrete evidence
- Best explain the period's trajectory
- Are most clearly supported by the events in the timeline
- Offer the most analytical insight (not just description)

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
