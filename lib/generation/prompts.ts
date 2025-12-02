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

Create the main narrative content that appears at the TOP of the timeline page.
This content must:
1. ORIENT readers to the world before these events
2. TELL THE STORY with forward momentum and event links
3. SHOW THE IMPACT—what changed because of this period

You are writing in the tradition of Barbara Tuchman: history as compelling narrative, grounded in specific detail, focused on causation and human experience. Write like you're telling a fascinating story to someone smart but distracted—they're one scroll away from leaving.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "pageTitle": "Engaging title (5-12 words)",
  "centralQuestion": "The dramatic tension driving this period (15-30 words)",
  "storyCharacter": "What type of story is this? (5-10 words)",
  "summary": "2-3 sentence logline (100-150 words)",
  
  "storyBeats": [
    {
      "beatType": "world-before|origins|rising-tension|etc.",
      "title": "Short title for this beat (3-8 words)",
      "paragraphs": ["paragraph 1", "paragraph 2"],
      "eventLinks": [
        {
          "textToLink": "exact text phrase to make clickable",
          "eventSlug": "matching-event-slug-from-skeleton"
        }
      ]
    }
  ],
  
  "themes": [
    {
      "id": "kebab-case-id",
      "title": "Theme Title (4-8 words)",
      "description": "What this theme means (40-60 words)"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
STORY BEAT SYSTEM
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: Not all timelines follow a conflict-driven narrative. Choose beats that genuinely fit this timeline's nature.

**AVAILABLE BEAT TYPES:**

OPENING BEATS (use 1-2):
- world-before - Status quo before change began. What was the situation?
- origins - Where/how something first emerged. For evolutionary topics.
- the-question - Central tension introduced. What problem needs solving?
- the-hook - Dramatic in medias res opening. Start with action or the weird thing.
- seeds-of-change - Early warning signs. Preconditions gathering.

DEVELOPMENT BEATS (use 2-4):
- development - Natural progression, deepening understanding. No conflict required.
- rising-tension - Building pressure, complications mounting, stakes increasing.
- expansion - Growth, spread, scaling up. For infrastructure/institutions.
- innovation - Key breakthrough or advancement. Technical or tactical.
- competing-forces - Different factions, approaches, or ideas in tension.
- the-mechanism - How something actually worked in practice.
- human-element - Personal stories, what it meant to live through this.
- case-study - Specific example that illuminates the broader pattern.

PIVOT BEATS (use 1-2):
- turning-point - Decisive moment that changed direction.
- crisis - Maximum danger, instability, or uncertainty.
- confrontation - Forces coming into direct conflict.
- breakthrough - Decisive advance, victory, or solution.
- twist - Unexpected recontextualization that changes how we see earlier events.
- decision - Critical choice by key figures that shaped outcomes.

RESOLUTION BEATS (use 1-2):
- transformation - How things fundamentally changed.
- new-order - The changed world/situation after events.
- aftermath - Immediate consequences of the climactic events.
- legacy - Long-term impact and enduring significance.
- synthesis - Bringing threads together into unified understanding.
- echoes - How this period influenced later events.
- open-questions - What remains debated or contested.

**RECOMMENDED PATTERNS:**

Military Conflicts (wars, conquests):
  world-before → rising-tension → confrontation → turning-point → aftermath → legacy

Dynasty/Political Periods:
  world-before → origins → development → crisis → transformation → legacy

Biographies:
  the-hook → world-before → rising-tension → decision → transformation → legacy

Thematic/Evolutionary (citizenship, philosophy, institutions):
  origins → development → case-study → twist → synthesis → legacy

Infrastructure/Technology (roads, aqueducts, engineering):
  origins → the-mechanism → innovation → expansion → human-element → legacy

You may deviate from these patterns if the material demands it. The goal is narrative truth, not formula.

═══════════════════════════════════════════════════════════════════════════════
STORY BEAT SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

**TOTAL LENGTH:** 6-8 story beats, 800-1200 words total across all beats.

**EACH BEAT SHOULD:**
- Have 1-3 paragraphs (100-200 words per beat)
- Include specific dates, names, numbers, and places
- Reference citations from research corpus [1], [2], etc.
- Include eventLinks to relevant skeleton events where appropriate
- Include at least one sensory detail (color, sound, texture)

**EVENT LINKS:**
Link to events when they are meaningfully mentioned in the narrative.
- textToLink: The exact phrase in your paragraph to make clickable
- eventSlug: Must match a slug from the skeleton's events array

Example:
{
  "beatType": "confrontation",
  "title": "Decision at Magnesia",
  "paragraphs": [
    "Near Magnesia ad Sipylum in winter 190/189, the Scipios faced Antiochus with 30,000 troops against a Seleucid host numbering perhaps 70,000 [2]. Eumenes' cavalry struck the Seleucid left; scythed chariots panicked their own lines, wheels clattering uselessly across the frozen ground..."
  ],
  "eventLinks": [
    { "textToLink": "Magnesia ad Sipylum", "eventSlug": "battle-of-magnesia" }
  ]
}

**OPENING BEAT(S) - ORIENT THE READER:**
Get to something interesting fast. Within 50 words, the reader should think "wait, what?"
Answer: What was the world like before? What forces were building? What do readers need to know?

**DEVELOPMENT BEATS - TELL THE STORY:**
Show causation: WHY did X lead to Y? Don't just list events—connect them.
Include the human element: decisions, stakes, what people at the time were thinking.
Use eventLinks to let readers explore specific events in detail.

**RESOLUTION BEAT(S) - SHOW THE IMPACT:**
Answer: What was fundamentally different after? Why does this period matter?
Connect to larger patterns. What echoes into later history?

═══════════════════════════════════════════════════════════════════════════════
WRITING REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

CORE PRINCIPLE: Write like you're telling a fascinating story to a friend who's smart but distracted. Your reader is on a phone, one click away from leaving. Make every sentence earn the next sentence.

**SENTENCE RHYTHM:**
- Vary sentence length dramatically
- Use short sentences (3-8 words) for impact after longer ones
- Pattern: Build tension with longer sentences → Release with short punch

Example rhythm:
"The Confederacy had held for four years against overwhelming odds, bleeding men and treasure across a thousand miles of contested ground. Then it collapsed. Soldiers deserted en masse."

**PARAGRAPH LENGTH:**
- 1-3 sentences per paragraph maximum
- Use one-sentence paragraphs for emphasis every 3-4 paragraphs
- Phone readers see walls of text and leave

**SENSORY DETAILS (one per beat minimum):**
- NAME actual colors: "scarlet and gold" not "bright colors"
- INCLUDE sounds: "the clash of iron," "tolled" not "rang," "murmured" not "said"
- Specific > generic always

**EXACT NUMBERS (never vague quantities):**
- ❌ BANNED: "many," "several," "numerous," "a large number of"
- ✅ REQUIRED: Exact figures with breakdown when possible

Bad: "Many soldiers died in the battle."
Good: "The battle killed 50,000 Romans—eight legions destroyed in a single afternoon [3]."

Better: "Seven queens rode in the procession—four dowager and three regnant [1]."
(The breakdown adds texture and shows you did your research)

**THE STATISTICAL + VISCERAL COMBO:**
When you give a number, make it FELT in the next sentence.

Example:
"Every day on average two people were destroyed at the city's rail crossings [4]. Pedestrians retrieved severed heads."

Pattern: Abstract statistic → Visceral specific reality

**TRANSLATE HISTORICAL DETAILS:**
Never leave historical information unexplained. Make it meaningful to modern readers.

❌ "The project cost 800 talents."
✅ "The project cost 800 talents—roughly the annual revenue of a prosperous Greek city-state [5]."

❌ "The army marched 300 stadia."
✅ "The army covered 300 stadia in three days—about 35 miles through mountain passes [2]."

**THE THREE SPECIFICS RULE:**
When describing any category, name three specific examples.

❌ "The streets were lined with establishments."
✅ "The streets angled past wine shops, gambling houses, and brothels."

❌ "He wore ceremonial regalia."
✅ "He wore a plumed helmet, gold braid, and a crimson sash."

**ACTIVE VERBS (ban the weak ones):**
❌ BANNED VERBS: was, were, went, made, did, had, got, came, said
✅ USE INSTEAD: Specific action verbs that show HOW or WHY

Test every verb: Could you use a more specific one?
- "tolled" not "rang" (tells you it's a funeral bell)
- "rode" not "went" (tells you how they traveled)
- "retrieved" not "found" (implies effort, aftermath)
- "destroyed" not "killed" (implies totality)

**CONVERSATIONAL CONNECTORS:**
- Use "But" not "However"
- Use "So" not "Therefore" or "Thus"
- Use "And" and "Now" to start sentences
- Sounds like speech, creates flow

**NARRATIVE TECHNIQUES:**
- "Stair-stepping" - Stakes should generally escalate through the narrative
- "Crazy progression" - Cover significant ground early to hook readers
- Corroborative detail - Every generalization needs a specific example
- Human element - People with names making decisions under pressure

═══════════════════════════════════════════════════════════════════════════════
BANNED PHRASES
═══════════════════════════════════════════════════════════════════════════════

VAGUE SIGNIFICANCE:
- "marked a turning point" → Show the turn happening
- "proved to be significant" → Explain the actual significance  
- "would have lasting consequences" → Name the consequences
- "paved the way" / "set the stage" → Explain the mechanism
- "testament to" / "symbol of" → Be specific about what it demonstrates

VAGUE QUANTITIES:
- "many" / "several" / "numerous" / "various" → Use exact numbers
- "significant number" / "considerable" → Use exact numbers
- "growing" / "increasing" → By how much? Over what period?

WEAK VERBS:
- was, were, is, are → Rewrite with action verbs
- went, came, got → Use verbs that show HOW (rode, marched, seized)
- made, did, had → Use verbs that show WHAT (constructed, executed, possessed)

THROAT-CLEARING:
- "It is important to note that" → Just state the thing
- "It should be mentioned that" → Just state the thing
- "In order to understand" → Just explain it

═══════════════════════════════════════════════════════════════════════════════
FIELD SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════════

1. PAGE TITLE (5-12 words)
Compelling and specific. Captures the essence. Get to the interesting thing.

❌ BAD: "Roman Citizenship"
✅ GOOD: "From City to Empire: Rome's Revolutionary Expansion of Citizenship"

❌ BAD: "The Punic Wars"  
✅ GOOD: "Rome vs. Carthage: The Century That Shaped the Mediterranean"

2. CENTRAL QUESTION (15-30 words)
The dramatic tension or central puzzle. Frame as a question with unclear outcome.

For conflict narratives:
✅ "Could Rome survive Hannibal's invasion when three legions lay dead on a single battlefield?"

For evolutionary narratives:
✅ "How did a city's local privilege become the legal foundation of the largest empire the world had seen?"

For technology narratives:
✅ "What made Roman concrete so durable that structures built with it still stand two millennia later?"

3. STORY CHARACTER (5-10 words)
What type of story is this? Be evocative.

Conflict: "A duel for Mediterranean supremacy"
Dynasty: "Five emperors who made Rome work"
Biography: "The general who became a god"
Evolutionary: "A privilege becomes a civilization"
Technology: "Engineering an empire's infrastructure"

4. SUMMARY (2-3 sentences, 100-150 words)
The logline. What's at stake? What happened? Why did it matter?
Use specific details, active voice, concrete claims.

5. STORY BEATS (6-8 beats, 800-1200 words total)
See detailed specifications above.

6. THEMES (3-5 themes)
Specific patterns or mechanisms—NOT generic categories.

❌ BAD: "Military Challenges" (vague)
✅ GOOD: "Citizen-Soldiers vs. Mercenaries: Rome's Manpower Advantage"

❌ BAD: "Political Changes" (generic)
✅ GOOD: "The Senate's Dilemma: Controlling Victorious Generals"

Each theme must:
- Connect to specific events in the skeleton
- Explain a PATTERN or MECHANISM, not just describe what happened
- Be substantive enough to support later analysis

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before submitting, verify:

STRUCTURE:
✓ Beat types genuinely fit this timeline (don't force conflict on non-conflict topics)
✓ Opening beat(s) orient readers to the world before events
✓ Resolution beat(s) show impact and legacy
✓ 6-8 beats total, 800-1200 words across all beats
✓ Each beat has an evocative title (not just the beat type name)

SPECIFICS:
✓ At least 8 specific dates/years mentioned
✓ At least 6 specific names mentioned  
✓ At least 5 eventLinks connecting narrative to skeleton events
✓ All numbers are exact (no "many," "several," "numerous")
✓ At least one color named per 200 words
✓ At least one sound detail per beat

LANGUAGE:
✓ No banned vague phrases anywhere
✓ No weak verbs (was, were, went, made, did, had, got)
✓ Short punch sentences (3-8 words) used for emphasis
✓ Paragraphs are 1-3 sentences max
✓ Historical details translated to modern equivalents where helpful
✓ Citations [1], [2] etc. reference research corpus

THEMES:
✓ 3-5 themes, all specific mechanisms (not generic categories)
✓ Each theme connects to skeleton events

READING EXPERIENCE:
✓ Opening beat makes reader think "wait, what?" within 50 words
✓ Forward momentum—readers want to keep reading
✓ Stakes escalate through the narrative
✓ Ending feels satisfying, not abrupt`;
}

export function buildPhase4EventsPrompt

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
${JSON.stringify(context.expandedEvents.map(e => ({ title: e.title, slug: e.slug, year: e.year, summary: e.summary })), null, 2)}
═══════════════════════════════════════════════════════════════════════════════
OUTPUT SCOPE (RETURN JSON ONLY)
═══════════════════════════════════════════════════════════════════════════════
Return a single JSON object with these arrays:
{
"people": [...],
"turningPoints": [...],
"perspectives": [...],
"themeInsights": [...],
"keyFacts": [...],
"interpretationSections": [...],  // NEW
"keyHighlights": [...]              // NEW
}
Use citation numbers that match the research corpus. Include the citation numbers used in each element so they can be rendered.
═══════════════════════════════════════════════════════════════════════════════
SECTION 1: PEOPLE (expand from skeleton)
═══════════════════════════════════════════════════════════════════════════════
For each person in the skeleton, generate:
{
"name": "Full Name",
"slug": "kebab-case-slug",
"birthYear": -100,
"deathYear": -44,
"role": "Brief role description (10-15 words)",
"bioShort": "2-3 sentence summary with citations",
"bioLong": "3-4 paragraphs with citations",
"relatedEventSlugs": ["event-slug-1", "event-slug-2"]
}
Keep bioShort to 80-120 words. Keep bioLong to 300-400 words.
═══════════════════════════════════════════════════════════════════════════════
SECTION 2: TURNING POINTS (3-5 pivotal moments)
═══════════════════════════════════════════════════════════════════════════════
Identify the 3-5 most pivotal moments that fundamentally changed the trajectory of events.
{
"title": "Event Title (from expanded events)",
"year": -100,
"description": "What happened (2-3 sentences)",
"whyItMatters": "Why this was a turning point (2-3 sentences)",
"beforeAfter": "What changed: before vs after (2-3 sentences)",
"citations": [1, 3, 7]
}
═══════════════════════════════════════════════════════════════════════════════
SECTION 3: PERSPECTIVES (4-6 analytical lenses)
═══════════════════════════════════════════════════════════════════════════════
Provide different analytical perspectives on this period. Generate 4-6 perspectives.
{
"category": "INTERPRETATIONS" | "DEBATES" | "CONFLICT" | "HISTORIOGRAPHY" | "WITH HINDSIGHT" | "SOURCES AND BIAS",
"title": "Short title (4-8 words)",
"content": "2-4 sentences explaining this perspective with citations",
"citations": [1, 3]
}
CATEGORY DEFINITIONS:

INTERPRETATIONS: Scholarly interpretations of events/motivations
DEBATES: Ongoing historical debates or contested questions
CONFLICT: On-the-ground realities vs. narratives
HISTORIOGRAPHY: How ancient sources portrayed events
WITH HINDSIGHT: What we can see in retrospect that wasn't clear then
SOURCES AND BIAS: Source limitations or biases

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: THEME INSIGHTS (3-4 themes ONLY) - SUBSTANTIVE AND SPECIFIC
═══════════════════════════════════════════════════════════════════════════════
Generate exactly 3-4 theme insights that capture the most important patterns or dynamics
of this period. Quality over quantity—each theme should be substantive and well-developed.
{
"id": "kebab-case-id",
"title": "Theme Title (4-8 words, specific not generic)",
"insight": "Main insight (2-3 sentences)",
"analysis": "Deeper analysis (2-3 sentences, optional)",
"modernRelevance": "Why this matters today (1-2 sentences, optional)",
"citations": [1, 3, 7]
}
AVOID GENERIC THEMES:
❌ "Military Challenges"
❌ "Political Instability"
❌ "Economic Problems"
GOOD THEMES:
✅ "The Frontier as Contact Zone" - specific mechanism
✅ "Logistics and Finance" - concrete pattern
✅ "Climate and Steppe Shockwaves" - environmental factor
═══════════════════════════════════════════════════════════════════════════════
SECTION 5: KEY FACTS (8-12 factoids)
═══════════════════════════════════════════════════════════════════════════════
Generate concise, memorable facts that surprise or illuminate.
{
"title": "Fact title (5-10 words)",
"detail": "Explanation (1-2 sentences)",
"citations": [1]
}
Examples:

"Velleius says 300,000 Italian youths died in the fighting [2]"
"Rome built 100 warships in 60 days [5]"

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: INTERPRETATION SECTIONS (4-6 themed analytical sections) NEW
═══════════════════════════════════════════════════════════════════════════════
Generate 4-6 thematic analytical sections that explore different dimensions of this period.
Each section should have:

A memorable title (3-6 words, ALL CAPS in display)
2-3 paragraphs of analysis (200-300 words total)
Multiple citations throughout

These sections appear in the "Interpretation & Significance" area and provide deep analysis.
{
"id": "kebab-case-id",
"title": "MEMORABLE SECTION TITLE",
"subtitle": "Optional explanatory subtitle (8-12 words)",
"content": "2-3 paragraphs of analytical prose with citations. Each paragraph should be 60-100 words. Use specific examples and explain mechanisms of change.",
"citations": [1, 3, 5, 7, 9]
}
SECTION THEMES (choose 4-6 that fit this timeline):
Examples for military/expansion timelines:

"A MEMORABLE, NOT A WALL" - How something was intended vs. what it became
"REFORM UNDER FISCAL FIRE" - Economic pressures driving change
"BECOMING ROMAN, BECOMING 'GERMANIC'" - Identity transformations
"WAR AS DIPLOMACY BY OTHER MEANS" - Military strategy as policy
"WEATHER AND RIVERS IN THE EAST" - Environmental/geographical factors
"LOGISTICS AND FINANCE" - Material constraints
"THE FRONTIER AS CONTACT ZONE" - Cultural exchange mechanisms

Examples for political/constitutional timelines:

"REPUBLIC TO AUTOCRACY" - Constitutional transformations
"THE FICTION OF SHARED POWER" - How systems maintained legitimacy
"MILITARY MAKES THE MAN" - Path to power changing
"CITIZENS INTO SUBJECTS" - Status transformations
"CRISIS BREEDS INNOVATION" - How pressure drove new solutions

Examples for social/reform timelines:

"EQUALITY OR INDEPENDENCE" - Competing visions of justice
"VIOLENCE AS LANGUAGE" - When talk failed
"INTEGRATION'S HIDDEN COST" - Unintended consequences
"WHO COUNTS AS 'US'" - Citizenship boundaries

REQUIREMENTS:

Each section must be 200-300 words (2-3 paragraphs)
Include at least 3-5 citations per section
Focus on MECHANISMS and PATTERNS, not just description
Connect to broader historical significance
Use specific examples from the research corpus

EXAMPLE SECTION:
{
"id": "reform-under-fiscal-fire",
"title": "REFORM UNDER FISCAL FIRE",
"subtitle": "Praetorian casualty lists and tribal-tax incentives meet the inevitable",
"content": "Praetorian casualty lists and inscribed victories read like invoices: Every legion spent had to be offset with spoils and tribute. Recruiting tribes from the Rhine crossings justified a swelling payroll [1], yet Caesar's dry-land census could barely track the newcomers, let alone tax them fairly [3]. When Tiberius froze new recruitments in 9 CE, he wasn't guided by morality—cash reserves had been gutted by the Teutoburg disaster, and the Rhine legions were bled dry [5]. The so-called 'Augustan settlement' survived not because Augustus was a genius administrator, but because he ruthlessly centralized the annona and tribute streams [7].\n\nThis fiscal squeeze drove unexpected innovation. Germanicus' 16 CE campaigns weren't pure revenge—they were debt-collection expeditions, hunting Varus' lost Eagles to reclaim legitimacy and ransoms [9]. Tacitus' account makes it clear that battlefield glory served the balance sheet: recovered standards meant propaganda wins, and propaganda wins meant senators would vote another appropriation [11]. Rome had weaponized its own insolvency.\n\nBy mid-century the pattern was entrenched: conquest campaigns became fiscal necessities. Claudius' British invasion in 43 CE wasn't just about expanding the empire—it was about seizing British gold and tin to pay for German garrisons [13]. The frontier had become an accounting problem dressed in a toga.",
"citations": [1, 3, 5, 7, 9, 11, 13]
}
═══════════════════════════════════════════════════════════════════════════════
SECTION 7: KEY HIGHLIGHTS (6-8 featured events) NEW
═══════════════════════════════════════════════════════════════════════════════
Select 6-8 of the most important events from the expanded events to highlight prominently.
These will be displayed in a featured grid with special formatting.
For each highlight:
{
"eventSlug": "battle-of-noreia",
"year": -113,
"title": "Battle of Noreia: Cimbri defeat Roman forces in Norcum",
"summary": "2-3 sentence summary of what happened",
"whyItMatters": "Why this event was crucial (2-3 sentences, 60-80 words). Explain the significance and impact.",
"immediateImpact": "What changed immediately after (1-2 sentences, 40-60 words). Concrete results.",
"tags": ["Military Defeat"],
"citations": [1, 3]
}
SELECTION CRITERIA:
Choose events that:

Changed the trajectory of the period
Had outsized immediate impact
Reveal key themes or patterns
Are dramatically compelling
Span the timeline chronologically

whyItMatters vs immediateImpact:

whyItMatters: Broader significance, long-term importance, why we care
immediateImpact: Concrete immediate results, what changed in the next days/weeks/months

EXAMPLE:
{
"eventSlug": "battle-of-arausio",
"year": -105,
"title": "Battle of Arausio: Roman catastrophe against Cimbri and Teutones",
"summary": "In 105 BCE, Gaius Marius met the rival Roman army led by Quintus Servilius Caepio near the Rhône. Internal disputes led Caepio to attack without coordinating with Marius, and both armies were shattered by the migrating Cimbri and Teutones [1]. Casualty estimates run as high as 80,000 Romans dead—more than Cannae [3].",
"whyItMatters": "This catastrophe exposed the deep dysfunction in Rome's military command structure and made reform unavoidable. The dual-command disaster proved that senatorial pride could kill legions, opening the door for Marius' revolutionary restructuring of recruitment and tactics [5]. It also terrified Rome—these weren't organized armies but tribal migrations, and Rome had no answer [7].",
"immediateImpact": "Marius was elected consul for 104 BCE with emergency powers to reform the army. He opened recruitment to landless citizens for the first time, creating professional soldiers loyal to their general rather than the state [9]. The Cimbri gained a year's breathing room and continued south [11].",
"tags": ["Military Defeat"],
"citations": [1, 3, 5, 7, 9, 11]
}
═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT EXAMPLE
═══════════════════════════════════════════════════════════════════════════════
{
"people": [...],
"turningPoints": [...],
"perspectives": [
{
"category": "INTERPRETATIONS",
"title": "Caesar's Gallic War: civil-bridge sanctification",
"content": "Scholars debate whether Caesar's Germanic campaigns were strategic defense or political theater for Roman audiences. Tacitus treats the Rhine as a natural boundary, but Velleius paints cross-river raids as essential buffer-building [1]. Recent analysis suggests both: Caesar needed military credentials for the consulship, but the German threat was real enough to justify the expense [3].",
"citations": [1, 3]
},
{
"category": "DEBATES",
"title": "Seasonal vs. permanent frontier?",
"content": "Did Rome intend a permanent Rhine-Danube frontier, or were forts merely winter camps for mobile field armies? Literary sources are ambiguous—Tacitus' Germania assumes a fixed line [5], but Dio describes continuous raiding and shifting boundaries [7]. Archaeological evidence shows permanent stone construction only after Varus' defeat [9].",
"citations": [5, 7, 9]
}
],
"themeInsights": [...],
"keyFacts": [...],
"interpretationSections": [
{
"id": "reform-under-fiscal-fire",
"title": "REFORM UNDER FISCAL FIRE",
"subtitle": "Praetorian casualty lists and tribal-tax incentives meet the inevitable",
"content": "...",
"citations": [1, 3, 5, 7, 9, 11, 13]
}
],
"keyHighlights": [
{
"eventSlug": "battle-of-arausio",
"year": -105,
"title": "Battle of Arausio: Roman catastrophe against Cimbri and Teutones",
"summary": "...",
"whyItMatters": "...",
"immediateImpact": "...",
"tags": ["Military Defeat"],
"citations": [1, 3, 5, 7, 9, 11]
}
]
}
═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════
✓ All content grounded in research corpus
✓ Multiple citations throughout (don't be sparse with citations)
✓ Interpretation sections are analytical, not descriptive
✓ Key highlights chosen strategically (not just chronologically)
✓ Perspectives show genuine different angles, not repetition
✓ Theme insights are specific mechanisms, not generic categories
✓ Writing is vivid and engaging, not academic and dry
`;
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
