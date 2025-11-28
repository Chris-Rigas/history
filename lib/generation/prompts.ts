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

Create the main narrative content that will appear at the TOP of the timeline page, BEFORE readers see the detailed event list.
This content must ORIENT readers—tell them what they're about to learn, who the key players are, and why it matters.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return a single JSON object with this structure:

{
  "pageTitle": "Engaging title for the page (different from seed title if appropriate)",
  "centralQuestion": "The dramatic tension that drives this period",
  "storyCharacter": "What type of story is this?",
  "summary": "2-3 sentence logline",
  "overview": ["paragraph 1", "paragraph 2", "paragraph 3", "paragraph 4"],
  "themes": [
    {
      "id": "kebab-case-id",
      "title": "Theme Title",
      "description": "What this theme means"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
WRITING REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

TONE & STYLE:
- Write for educated general readers, not academics
- Avoid jargon without explanation
- Use active voice and concrete details
- Balance accessibility with intellectual depth

NARRATIVE APPROACH:
- Think in terms of: setup → rising tension → transformation → consequences
- Show causation: explain WHY things happened, not just WHAT happened
- Connect events to broader patterns and human experiences

BANNED VAGUE PHRASES:
- "marked a turning point" (show the turn instead)
- "proved to be significant" (explain the significance)
- "testament to" / "symbol of" (be specific about what it demonstrates)
- "paved the way" / "set the stage" (explain the actual mechanism)

REQUIRED ELEMENTS:
- Include specific dates, names, places, numbers from the skeleton
- Reference citations from research corpus where appropriate [1]
- Make abstract concepts concrete with examples

═══════════════════════════════════════════════════════════════════════════════
FIELD SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

1. PAGE TITLE (5-12 words)
A compelling, specific title that captures the essence of this period.

❌ BAD: "The Roman Empire"
✅ GOOD: "Rome's Transformation from Republic to Empire"
✅ GOOD: "The Crisis That Nearly Destroyed Rome"

2. CENTRAL QUESTION (1 sentence, 15-30 words)
The dramatic tension or unresolved problem that drives this period. Frame as a question with unclear outcome.

Examples:
- "Could one man hold absolute power while maintaining the fiction of republican government?"
- "Would Rome's military success destroy the republic it was meant to protect?"
- "When the emperor became a prize won by armies, who could restore stability?"

3. STORY CHARACTER (5-10 words)
What TYPE of story is this? Use evocative language.

Examples:
- "A dynasty's rise and tragic fall"
- "Empire building its own trap"  
- "Republic's violent transformation into autocracy"
- "Survival against impossible odds"

4. SUMMARY (2-3 sentences, 100-150 words)
The "logline" of this historical period. Answer: What's the ONE big story?

Make someone care in three sentences:
- What was at stake?
- What happened?
- Why did it matter?

Use concrete details, active voice, specific claims.

5. OVERVIEW (4 paragraphs, 400-500 words total)

This is the STORY of the period, structured dramatically:

**PARAGRAPH 1 - SETUP (100-120 words)**
- What was the world like before this period?
- What tensions or forces were building?
- Make it feel like something HAD to happen
- Include specific context from research corpus

Example opening: "By 235 CE, Rome had weathered five decades of relative stability under the Severan dynasty. But when the last Severan emperor fell to assassination, he left no clear successor—and no mechanism to choose one. What followed was fifty years of chaos that nearly destroyed the empire."

**PARAGRAPH 2 - RISING ACTION (120-150 words)**
- How did people try to solve the setup's problems?
- What new complications arose?
- Show the building momentum
- Include specific turning points with dates from skeleton

**PARAGRAPH 3 - CLIMAX & TRANSFORMATION (100-120 words)**
- What was the decisive moment or period?
- How did everything change?
- Make the reader feel the weight of the shift
- Ground in specific events from skeleton

**PARAGRAPH 4 - RESOLUTION & CONSEQUENCES (80-110 words)**
- How did this period end?
- What was fundamentally different after?
- Bridge to what came next
- Connect to larger historical patterns

6. THEMES (3-5 themes)

Create thematic categories that reveal the FORCES at play in this period.

For each theme:
- **id**: kebab-case identifier (e.g., "naval-adaptation")
- **title**: Clear, specific title (4-8 words) - NOT generic like "Change and Continuity"
- **description**: What this theme means (2-3 sentences, 40-60 words)

**GOOD THEME EXAMPLES:**
{
  "id": "emperor-as-soldier",
  "title": "When Emperors Became Battlefield Commanders",
  "description": "Before 235, emperors ruled from Rome and managed politics. After Maximinus Thrax—a career soldier who never visited Rome—every emperor had to be a battlefield commander first. The question wasn't whether an emperor would lead armies, but where he would die: in civil war or defending the frontiers."
}

{
  "id": "currency-collapse", 
  "title": "The Collapse of Silver Currency",
  "description": "Rome's silver denarius dropped from 90% silver content to less than 5% over fifty years. This wasn't just inflation—it was the breakdown of the economic system that had sustained the empire for centuries, forcing a fundamental restructuring of taxation and trade."
}

**BAD THEME EXAMPLES (avoid these):**
❌ "Military Challenges" (too vague)
❌ "Political Instability" (generic)
❌ "Economic Problems" (no specificity)

**THEME REQUIREMENTS:**
- Must connect to specific events in the skeleton
- Must explain a PATTERN or MECHANISM, not just describe what happened
- Must be substantive enough to support later analysis in Phase 5

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before submitting, verify:
✓ Central question is genuinely uncertain and drives the narrative
✓ Overview paragraphs follow dramatic structure (setup → climax → resolution)
✓ At least 5 specific dates/years mentioned in overview
✓ At least 3 specific names mentioned in overview
✓ Themes are specific and substantive, not generic categories
✓ No banned vague phrases appear in any field
✓ Summary makes someone want to learn more (creates curiosity)
✓ Every paragraph advances the story, doesn't just list facts`;
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

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Expand each skeleton event into FULL NARRATIVE CONTENT with three components:
1. SUMMARY (the hook - 2-3 sentences)
2. DESCRIPTION (the full story - 4-6 paragraphs, 600-800 words)
3. SIGNIFICANCE (the consequences - 3-4 paragraphs, 300-400 words)

You are a narrative historian in the tradition of Erik Larson and Barbara Tuchman. Everything must be:
- HISTORICALLY ACCURATE (grounded in research corpus)
- DRAMATICALLY COMPELLING (tell the story vividly)
- PROPERLY SOURCED (cite the research corpus)

═══════════════════════════════════════════════════════════════════════════════
CRITICAL GROUNDING REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

EVERY EVENT MUST INCLUDE:
✓ At least 2-3 SPECIFIC NUMBERS with citations (troop counts, casualties, costs, distances, durations)
✓ At least 1 COLOR mentioned (what did it look like?)
✓ At least 1 SOUND described (what did people hear?)
✓ At least 2 SPECIFIC PLACES named (where exactly did this happen?)
✓ At least 3-5 CITATIONS to research corpus [1], [2], etc.

BANNED VAGUE PHRASES (never use these):
❌ "symbol of" / "testament to" / "encapsulated"
❌ "insatiable thirst" / "magnificent" without specifics
❌ "many" / "several" / "numerous" (give exact numbers)
❌ "significant" / "important" without explaining WHY
❌ "marked a turning point" (show the turn instead)

REQUIRED APPROACH:
- Lead with ACTION and SPECIFICS, not abstractions
- Use active voice and vivid verbs
- Translate ancient numbers into modern context when helpful
- Include direct quotes from primary sources when available in research corpus
- Make readers FEEL like they're there, witnessing events

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Return a single JSON object:

{
  "expandedEvents": [
    {
      "title": "Event title from skeleton",
      "year": -216,
      "slug": "battle-of-cannae",
      "summary": "2-3 sentence hook...",
      "description": "Full narrative in paragraphs...",
      "significance": "Consequences and impact...",
      "citations": [1, 3, 7, 12]
    }
  ]
}

**CRITICAL**: 
- Process ALL events in the eventsChunk array
- Maintain chronological awareness across events
- slug should be kebab-case version of title

═══════════════════════════════════════════════════════════════════════════════
PART 1: SUMMARY (2-3 sentences, 100-150 words)
═══════════════════════════════════════════════════════════════════════════════

The hook that makes someone care in three sentences.

FORMULA:
- Sentence 1: WHO did WHAT and WHERE (lead with action)
- Sentence 2: Include ONE concrete detail that makes it real
- Sentence 3: Hint at significance or consequence

**EXAMPLES:**

❌ BAD: "Augustus consolidated power in 27 BCE. This was an important moment in Roman history."

✅ GOOD: "In January 27 BCE, Augustus stood before the Roman Senate and theatrically offered to resign all his powers—knowing they would beg him to stay [1]. They did, granting him unprecedented authority wrapped in republican titles [3]. In one choreographed moment, he transformed from warlord to constitutional monarch, a template that would define emperorship for three centuries [7]."

❌ BAD: "Hannibal won a great victory at Cannae."

✅ GOOD: "On August 2, 216 BCE, Hannibal Barca executed a double envelopment that destroyed eight Roman legions in a single afternoon, killing between 50,000 and 70,000 men [1]. The battlefield at Cannae became a butcher's floor—Polybius later wrote that the Aufidus River ran red, and Roman corpses covered six square miles [3]. It remains the deadliest single day of combat in Western military history [7]."

REQUIREMENTS:
- Use ACTIVE VOICE and strong verbs
- Include at least ONE specific number with citation
- Ground in a specific TIME and PLACE
- Create visual imagery
- Reference at least 2-3 citations

═══════════════════════════════════════════════════════════════════════════════
PART 2: DESCRIPTION (4-6 paragraphs, 600-800 words)
═══════════════════════════════════════════════════════════════════════════════

Tell this as a STORY with dramatic structure. Organize by causation, use chronological narrative within sections.

**STRUCTURE:**

**SECTION A: CAUSES (1-2 paragraphs, 150-250 words)**

Set the scene BEFORE this event. Answer:
- What was the situation before this happened?
- What pressures or tensions were building?
- What made this event likely or inevitable?
- What did people at the time think was happening?

MAKE IT CONCRETE:
✅ "By 23 BCE, Augustus had survived three assassination plots [2]. His household guard numbered only 300 men [5]—laughably insufficient if the legions turned against him."
❌ "There was growing instability and Augustus faced threats."

REQUIRED in this section:
- At least 2 specific dates or time references
- At least 2 specific numbers with citations
- At least 1 quote from primary source (if available in research corpus)
- Make readers see the powder keg about to explode

**SECTION B: THE EVENT ITSELF (2-3 paragraphs, 300-400 words)**

The chronological narrative of WHAT ACTUALLY HAPPENED.

CRITICAL: Make this VISUAL and SENSORY

Answer:
- What time of day? What season?
- What did people see, hear, smell?
- Who was there? What did they say or do?
- What were the specific actions taken in sequence?
- Were there pivotal moments or decisions?

SCENE-SETTING EXAMPLES:
✅ "In the Senate chamber on the Ides of January, 27 BCE, purple-striped togas packed the benches [3]..."
✅ "The vote was 400 to 7 [5]. Only the die-hard republicans dared oppose him openly."
✅ "Augustus paused, visibly emotional, then removed his signet ring and placed it on the Senate floor [1]—the gesture of a man surrendering power. The theater of it was perfect."

USE THE STATISTICAL + VISCERAL COMBO:
- State a number with citation
- Immediately follow with sensory, concrete detail with citation

Example: "Fifty thousand Romans died at Cannae [1]. By sunset, the field was carpeted with bodies so thick that survivors couldn't walk without stepping on corpses [3]."

REQUIRED in this section:
- At least 1 COLOR
- At least 1 SOUND  
- At least 3 specific PLACES or LOCATIONS
- At least 3 NUMBERS
- Chronological sequence (what happened first, second, third)
- Direct quotes from primary sources if available

**SECTION C: IMMEDIATE CONSEQUENCES (1-2 paragraphs, 150-200 words)**

What happened IMMEDIATELY after? In the days, weeks, months following?

Show the direct, tangible results:
- Who gained/lost power?
- What changed on the ground?
- How did people react?
- What became possible/impossible?

AVOID ABSTRACTION:
❌ "This had major consequences for the empire."
✅ "Within three months, Augustus had reorganized the Praetorian Guard from 300 men to 4,500 [7]. They answered to him alone, not the Senate [9]. Rome now had what it had never permitted before: a permanent military force stationed inside the city walls [12]."

═══════════════════════════════════════════════════════════════════════════════
PART 3: SIGNIFICANCE (3-4 paragraphs, 300-400 words)
═══════════════════════════════════════════════════════════════════════════════

Explain the LONGER-TERM CONSEQUENCES and WHY THIS MATTERED.

**PARAGRAPH 1: Direct Impact (80-100 words)**
What CHANGED because of this event? Be specific and measurable.

Example: "Augustus' settlement established the template for all future emperors: concentrate real power while preserving republican appearances [2]. The Senate kept its prestige and formal authority over provinces like Africa and Asia [5]. Augustus kept control of the armies, the frontier provinces, and the grain supply [7]. This division would persist for three centuries."

**PARAGRAPH 2: Broader Patterns (80-100 words)**
Connect to larger themes from main narrative. How does this event exemplify or advance those themes?

Example: "This moment crystallized Rome's central contradiction: how to maintain autocracy while pretending to preserve republican government [3]. Every emperor after Augustus would face this same challenge—and most would fail. The fiction worked only as long as emperors were willing to perform it [8]."

**PARAGRAPH 3: Mechanisms & Causation (80-100 words)**
Explain HOW this event led to what came next. Show the causal chain.

Example: "By creating a legal framework for one-man rule, Augustus made civil war the ONLY mechanism for succession [4]. There was no constitutional way to choose the next emperor. This guaranteed that nearly every transition would be violent—and it ensured the dynasty's eventual destruction [9]."

**PARAGRAPH 4 (OPTIONAL): Legacy & Historical Debate (60-80 words)**
What did later historians or participants say about this? Are there scholarly debates?

Example: "Tacitus, writing a century later, saw Augustus' settlement as the death of liberty dressed in constitutional robes [6]. Modern historians debate whether Augustus was a cynical manipulator or a pragmatic reformer forced by circumstance [11]. Either way, he created a system that shaped Mediterranean civilization for centuries [15]."

REQUIREMENTS:
- Connect to themes from main narrative
- Explain MECHANISMS (how X led to Y)
- Use specific examples and citations
- Avoid vague claims of "importance"—show concrete effects
- No speculation without evidence from research corpus

═══════════════════════════════════════════════════════════════════════════════
CITATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

EVERY EVENT MUST:
- Include 3-5 citations minimum
- Cite the research corpus using [number] format
- Place citations after specific claims, not paragraphs
- Use citations for: numbers, dates, quotes, controversial claims

FORMAT: "The Roman army numbered 86,000 men [3], while Hannibal commanded roughly 50,000 [7]."

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST (verify each event)
═══════════════════════════════════════════════════════════════════════════════

Before submitting, verify EACH event has:
✓ At least 2-3 specific numbers with citations
✓ At least 1 color mentioned
✓ At least 1 sound described
✓ At least 2 specific places named
✓ 3-5 citations to research corpus
✓ No banned vague phrases
✓ Active voice throughout
✓ Summary that creates curiosity
✓ Description that shows causation
✓ Significance that explains mechanisms
✓ Connects to themes from main narrative`;
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

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Write a 5-7 paragraph NARRATIVE RECAP (approximately 400-600 words total) that synthesizes the full sweep of this era into a dramatic, cohesive story.

You are writing in the tradition of Barbara Tuchman and Erik Larson: pull readers through the story arc, show causation and consequences, make history feel immediate and real.

This recap appears AFTER users have seen the detailed timeline. Assume they know the events—your job is to weave them into a STORY with beginning, middle, and end.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "paragraphs": ["paragraph 1 text", "paragraph 2 text", ...]
}

Each paragraph should be 60-100 words. Total: 400-600 words across 5-7 paragraphs.

═══════════════════════════════════════════════════════════════════════════════
WRITING REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. **BUILD DRAMATIC ARC**
Don't just list events—show causation, tension, and consequences. Answer "why did THIS lead to THAT?"

2. **USE VIVID, SPECIFIC LANGUAGE**
- Replace generic phrases ("significant event", "major development") with concrete details
- Include years, names, places, and numbers from the events
- Show don't tell: instead of "tensions rose", describe what actually happened

3. **CREATE FORWARD MOMENTUM**
- Each paragraph should pull the reader into the next
- Use temporal connectors that show causation: "This triggered...", "In response...", "Years later, the consequences became clear when..."
- End paragraphs with hooks that create suspense or anticipation

4. **MAINTAIN HISTORICAL ACCURACY**
- Only reference events provided in the input
- Don't invent details not present in the event summaries
- If an event summary is thin, work with what you have

5. **INTEGRATE EVENTS NATURALLY**
- Mention events by name, but work them into flowing sentences
- Don't force every event into the narrative—focus on the most pivotal ones
- Use thematic grouping when multiple events relate to the same development

═══════════════════════════════════════════════════════════════════════════════
PARAGRAPH STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

**PARAGRAPH 1 - HOOK (60-80 words)**
Establish the era's defining tension or question. Make readers care.

Example: "By 235 CE, Rome had weathered fifty years of relative stability under the Severan dynasty. But when the last Severan emperor fell to assassination that March, he left no clear successor—and no mechanism to choose one. The question wasn't whether civil war would follow, but how many emperors would die before someone restored order."

**PARAGRAPHS 2-5 - RISING ACTION & TURNING POINTS (70-100 words each)**
Show the major developments, escalations, and dramatic moments.

TECHNIQUES:
- Group related events thematically
- Show how one event triggered another
- Include specific years and names
- Build tension toward climax
- Use concrete details, not abstractions

Example: "The pattern emerged immediately. Maximinus Thrax seized power through military acclaim—the first emperor who never visited Rome during his reign. For three years he fought on the Rhine and Danube frontiers, funded by confiscating senatorial estates. When the Senate finally rebelled in 238, they appointed two emperors at once. Within months, both were dead, killed by their own guards."

**PARAGRAPH 6-7 - RESOLUTION & CONSEQUENCES (60-90 words)**
How did this period end? What was fundamentally different after? What legacy did it leave?

Example: "When Diocletian finally stabilized the empire in 284, the old Augustus model was extinct. The emperor was now a military commander first, ruling from frontier camps, surrounded by armies. The Senate had become ceremonial. The transformation was complete: Rome had become an autocracy that no longer bothered to pretend otherwise."

═══════════════════════════════════════════════════════════════════════════════
BANNED PHRASES (avoid at all costs)
═══════════════════════════════════════════════════════════════════════════════

Never use these clichés:
❌ "marked a turning point"
❌ "proved to be significant"
❌ "would have lasting consequences"
❌ "testament to"
❌ "encapsulated"
❌ "paved the way"
❌ "set the stage"

Instead: SHOW the change happening. Use active verbs and concrete details.

❌ BAD: "The battle marked a turning point in Roman military strategy."
✅ GOOD: "After Cannae, Rome never again fielded a single massive army. Instead, they deployed multiple smaller legions, refusing to give Hannibal another opportunity for annihilation."

═══════════════════════════════════════════════════════════════════════════════
STYLE GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

DO:
✓ Use active voice
✓ Start paragraphs with strong, clear statements
✓ Include specific dates (years minimum)
✓ Name key figures by name
✓ Use numbers to show scale
✓ Connect cause to effect explicitly
✓ End paragraphs with forward momentum
✓ Vary sentence length for rhythm

DON'T:
✗ Use passive voice without reason
✗ Make vague claims about "significance"
✗ List events without showing connections
✗ Forget the human element
✗ Use academic jargon unnecessarily
✗ Write flat, lifeless prose
✗ Ignore the dramatic arc

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before submitting, verify:
✓ Follows dramatic arc (setup → rising action → climax → resolution)
✓ 5-7 paragraphs, 400-600 words total
✓ Each paragraph flows into the next
✓ At least 5 specific years/dates mentioned
✓ At least 5 specific names mentioned
✓ No banned phrases
✓ Shows causation (X led to Y because Z)
✓ References the most pivotal events from the timeline
✓ Ends with sense of completion or legacy
✓ Reads like a compelling story, not a textbook

═══════════════════════════════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════════════════════════════

You're not writing an encyclopedia entry. You're telling the story of how this era unfolded—the tensions, the decisions, the consequences, the human drama. Make readers feel the weight of these moments. Make it sing.`;
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
