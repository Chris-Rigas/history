import type {
  GenerationContext,
  ResearchCorpus,
  TimelineSeed,
} from './types';

import { slugify } from '@/lib/utils';


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
  ],

  "keyPeople": ["Full Name 1", "Full Name 2", "Full Name 3", "Full Name 4"]
}

═══════════════════════════════════════════════════════════════════════════════
KEY PEOPLE SELECTION (CRITICAL - MUST INCLUDE)
═══════════════════════════════════════════════════════════════════════════════

From the skeleton people list, select 4-6 individuals who are CENTRAL to this narrative.

SELECTION CRITERIA:
✓ These people appear multiple times in your story beats
✓ They drive major turning points in the narrative
✓ They represent different perspectives or factions
✓ Their actions directly caused significant outcomes
✓ They are essential to understanding the central question

OUTPUT as an array of names (must exactly match skeleton person names):

"keyPeople": ["Full Name 1", "Full Name 2", "Full Name 3", "Full Name 4"]

IMPORTANT: Use the exact full names as they appear in the SKELETON people list above.
Do NOT include people who are only mentioned briefly.
Do NOT include more than 6 people.

═══════════════════════════════════════════════════════════════════════════════
STORY BEAT SYSTEM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
BEFORE WRITING ANY BEATS, perform this internal reasoning process. Do NOT begin narrative construction until all steps are fully answered internally.

1. NARRATIVE FRAME (the spine of the story)

Identify one clean, unifying through-line that makes the entire narrative coherent.

It must be a single macro tension, not a collection of events.

It must create forward motion and rising stakes.

It must explain why the selected events matter.

Good:

“A general’s gamble for political survival spirals into the creation of an empire.”

Bad:

“Multiple military campaigns in Gaul with different tribal leaders.”

Everything in the story should connect back to this frame like ribs to a spine.

2. CORE EVENTS (the essential 8–10 beats that carry the rising action)

From the entire historical/event skeleton, select only the events that directly advance the through-line.

For each selected event, the AI must internally justify:

How does this event raise the stakes?

How does it push the protagonist closer to or further from their goal?

How does it contribute to setup → escalation → payoff?

If an event does not meaningfully advance the rising action, it is not a core event. It becomes background context and should appear only briefly if necessary.

Constraint:

Cap core events at 8–10 total. Do not exceed this.

These events should form a clean arc: setup, escalation, complication, crisis, payoff.

3. CORE PEOPLE (strict limit: 5–6 total)

Choose only the characters essential to driving the narrative tension.

Protagonist(s)

Whose struggle defines the story?

Who carries the emotional and strategic weight?

Antagonist(s)

Who or what meaningfully opposes them and shapes their decisions?

Key Supporting (1–3 maximum)

Only those whose actions directly shape the core events or pivotal choices.

Rules:

Total character set must not exceed 6.

Anyone outside this group may appear only if strictly required and only in 1–2 sentences.

Do not introduce new names mid-story unless absolutely unavoidable.

If a figure does not influence the narrative spine or one of the core events, they should not receive narrative weight.

4. FILTERING INFORMATION (to prevent clutter and fragmentation)

Before writing beats, filter all available information through these questions:

Does this detail advance the through-line?

Does this person change the protagonist’s path?

Does this event escalate stakes or set up the payoff?

If removed, would the narrative still make sense?

If the answer is “yes, it still works,” the detail gets cut.

This prevents digression, character overload, and the “Wikipedia list of subplots” problem.

5. NARRATIVE EXECUTION RULES (when writing the beats)
Clarity First

Each beat must follow logically from the previous one.

Avoid branching subplots and side quests.

Escalation

The beats must show tension increasing, problems compounding, or stakes rising.

Simplicity

Summarize supporting events in one sentence if they are not part of the core skeleton.

Keep the storyline extremely readable and cohesive.

Continuity

Maintain one protagonist journey, one central conflict, one payoff.

Economy

No new major characters after beat 3.

No more than one major setting shift per act unless essential.

No exposition dumps: information must be embedded organically.

═══════════════════════════════════════════════════════════════════════════════
HOOK / OPENING BEAT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════


How to Craft a Strong Hook for Text-Only Content
1. Create immediate emotional or intellectual excitement

Your first sentence should spark curiosity, tension, surprise, or a bold claim. If you don’t feel energized writing it, readers won’t feel energized reading it.

2. Promise a payoff the reader must reach

Make it clear right away what the reader will gain—an answer, a twist, a secret, an insight, a resolution, a revelation. The hook should make the rest of the piece feel too rewarding to skip.

3. Keep the idea extremely simple and instantly graspable

The reader should understand the core premise in seconds. Clarity beats cleverness—especially for a broad audience.

4. Avoid warm-ups, throat-clearing, or background

Drop readers directly into the core tension or core idea. No slow buildup, no “Before I explain…” Just lead with the most compelling point immediately.

5. Remove every dull sentence in the first 3–5 lines

Retention in text is about momentum. The opening should feel fast, clean, and purposeful. Anything that doesn’t accelerate the reader gets cut.

6. Use formats that naturally hook readers

Certain text structures make people want to keep going:

A mystery or question: “Why did a single decision in 1998 reshape the entire industry?”

Stakes escalating: each paragraph revealing something bigger or stranger

A bold challenge: “Here’s the most counterintuitive thing I’ve learned in 10 years.”

A narrative that builds toward a reveal

Choose a format that inherently pulls the reader forward.

7. Lead with something novel or unexpected

Text hooks thrive on surprise value. A surprising fact, contradiction, anecdote, or claim instantly signals: this won’t be predictable.

8. Take a bigger swing than feels safe

A great hook is not lukewarm. It should feel bold, declarative, or sharply framed. Safe openings disappear; strong openings stand out.

9. Sound authentically like a human, not a corporate memo

Readers respond to honesty, personality, and real stakes. Plain, direct language is always better than polished but empty phrasing.

10. Make the reader understand what the journey will be

Within a few sentences, they should know:

What this is about

Why it matters

Where it’s going

The clarity of the roadmap is part of the hook.

═══════════════════════════════════════════════════════════════════════════════
STORY BEAT SYSTEM
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: Not all timelines follow a conflict-driven narrative. Choose beats that genuinely fit this timeline's nature.

**AVAILABLE BEAT TYPES:**

OPENING BEATS (Just 1):
- Use hook / opening beat instructions above.

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
BEAT CONNECTION APPROACH
═══════════════════════════════════════════════════════════════════════════════

BEAT CONNECTIONS (required):

Each beat after the first MUST begin with a transition that:
- References something from the previous beat
- Shows causation or consequence
- Creates momentum ("Because X... / After X... / But X meant...")

Each beat after beat 3 SHOULD include at least one callback to an earlier beat:
- "The same Rhine that Ariovistus had crossed now..."
- "Caesar's debts—the ones that drove him north—now..."

BAD (standalone):
Beat 3: "By 57 BCE, a Belgic coalition gathered..."
Beat 4: "Next, Caesar turned west..."

GOOD (connected):
Beat 3: "The speed that crushed the Helvetii now alarmed the north. By 57 BCE, a Belgic coalition gathered..."
Beat 4: "The Belgic victory bought Caesar credibility—but also enemies. He turned west, where the Veneti..."

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

**SENSORY DETAILS (include when it makes sense, don't force it):**
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

**CONVERSATIONAL CONNECTORS:**
- Use "But" not "However"
- Use "So" not "Therefore" or "Thus"
- Use "And" and "Now" to start sentences
- Sounds like speech, creates flow

═══════════════════════════════════════════════════════════════════════════════
CLARITY BEFORE COLOR (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

The vivid writing techniques above must FOLLOW a foundation of clarity, not replace it.


**FIRST MENTION REQUIREMENTS:**

When a PERSON is first mentioned:
✓ Include their role/position: "Pescennius Niger, governor of Syria and rival claimant to the throne"
✓ Why they matter to this story: "whose eastern legions matched Severus in number"
✗ NOT just: "Severus met Pescennius Niger and broke him"

When a CONFLICT is first mentioned:
✓ One sentence on what's at stake: "Three generals now claimed the purple; only one would survive"
✓ Why it's happening: "The Praetorians had auctioned the throne, and the frontier armies refused to accept their choice"
✗ NOT just: "Civil war erupted on two fronts"

When a PLACE is first mentioned:
✓ Brief orientation if not obvious: "Lugdunum (modern Lyon), the key to Gaul"
✗ NOT just: "at Lugdunum in 197"

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: EVENT SLUG MATCHING RULES
═══════════════════════════════════════════════════════════════════════════════

When creating eventLinks in your storyBeats, you MUST use slugs that EXACTLY match 
the skeleton events above.

HOW TO CREATE MATCHING SLUGS:
1. Take the EXACT event title from the skeleton (e.g., "First Dacian War (101–102)")
2. Convert to lowercase
3. Replace spaces with hyphens
4. Replace parentheses and special characters with hyphens
5. Remove consecutive hyphens

CORRECT SLUG EXAMPLES from the skeleton above:
${(skeleton?.events || []).slice(0, 5).map((e: any) => 
  `- Event title: "${e.title}"\n  → Correct slug: "${slugify(e.title)}"`
).join('\n')}

WRONG: Modifying titles or omitting year ranges from slugs
RIGHT: Using the exact slugified version of the skeleton title

If an event is "First Dacian War (101–102)", the slug MUST be "first-dacian-war-101-102"
NOT "first-dacian-war" or "dacian-war-101-102" or any variation.

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

6. THEMES (4-6 themes)
═══════════════════════════════════════════════════════════════════════════════

Create thematic categories that reveal the FORCES and MECHANISMS at play in this period.
These will be expanded into full "Thematic Threads" in later phases.

**FORMAT:**
{
  "id": "kebab-case-id",
  "title": "Theme Title (4-8 words)",
  "description": "What this theme means and why it matters (40-60 words)"
}

**THEME REQUIREMENTS:**

Each theme should identify a specific MECHANISM or PATTERN, but be grouped into relatively high level categories to connect immediately to concepts the reader is familiar with.


**DESCRIPTION STRUCTURE:**

Each description should answer:
1. What pattern or mechanism does this theme capture?
2. How did it work in practice?
3. Why did it matter for outcomes?

**EXAMPLE:**

{
  "id": "treaty-as-security-architecture",
  "title": "Treaty as Security Architecture",
  "description": "Apamea wasn't just punishment—it was a system designed to neutralize Seleucid power permanently. The 12,000-talent indemnity drained the treasury; the fleet cap eliminated naval threat; the elephant ban ended their tactical advantage. Each clause targeted a specific capability."
}

**VARIETY REQUIREMENT:**

Generate 4-6 themes covering different aspects:
- Military/strategic patterns
- Political/diplomatic mechanisms
- Structural/systemic dynamics
- Geographic/logistical factors (if relevant)
- Economic patterns (if relevant)

Avoid having multiple themes that cover the same ground from slightly different angles.

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
✓ Each beat picks up where the last one left off, building narrative tension


LANGUAGE:
✓ No banned vague phrases anywhere
✓ No weak verbs (was, were, went, made, did, had, got)
✓ Short punch sentences (3-8 words) used for emphasis
✓ Paragraphs are 1-3 sentences max
✓ Historical details translated to modern equivalents where helpful
✓ Citations [1], [2] etc. reference research corpus
✓ All numbers are exact (no "many," "several," "numerous")


THEMES:
✓ 3-5 themes, all specific mechanisms (not generic categories)
✓ Each theme connects to skeleton events

READING EXPERIENCE:
✓ Everything is explained to a user who has a high school level of knowledge about history; they are interested by not experts
✓ Opening beat makes reader think "wait, what?" within 50 words
✓ Forward momentum—readers want to keep reading
✓ Stakes escalate through the narrative
✓ Ending feels satisfying, not abrupt`;
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

MAIN NARRATIVE (the overall story these events belong to):
${JSON.stringify(context.mainNarrative, null, 2)}

KEY PEOPLE (central figures in this narrative - focus on these when relevant):
${JSON.stringify(context.mainNarrative.keyPeople, null, 2)}

AVAILABLE THEMES (assign exactly ONE to each event):
${JSON.stringify(context.mainNarrative.themes.map(t => ({ id: t.id, title: t.title })), null, 2)}

EVENTS TO EXPAND:
${JSON.stringify(eventsChunk, null, 2)}

═══════════════════════════════════════════════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════════════════════════════════════════════

Expand each skeleton event into FULL NARRATIVE CONTENT that fits within the larger timeline story.

Each event is a CHAPTER in the bigger narrative established in Phase 3. Your job is to:
1. Tell this event's story compellingly while maintaining narrative continuity
2. Connect to adjacent events—readers may arrive from other event pages
3. Feature key people prominently when they're involved; introduce others clearly

You are writing in the tradition of Barbara Tuchman: history as compelling narrative, grounded in specific detail, focused on causation and human experience.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

For each event, produce:

1. SUMMARY (the hook - 2-3 sentences, 50-80 words)
2. DESCRIPTION (the full story - 4-6 paragraphs, 600-800 words)
3. SIGNIFICANCE (the consequences - 3-4 paragraphs, 300-400 words)
4. THEME ASSIGNMENT (exactly one theme ID from the list above)
5. CATEGORY (one of: military, political, diplomatic, economic, cultural, crisis, legal, administrative)

═══════════════════════════════════════════════════════════════════════════════
NARRATIVE POSITIONING
═══════════════════════════════════════════════════════════════════════════════

Each event exists within the larger narrative arc. Before writing, consider:

**WHERE IN THE STORY IS THIS EVENT?**
- Early events: More context needed; establish stakes and introduce key players
- Middle events: Can assume some familiarity; focus on escalation and complications
- Late events: Show consequences; connect to resolution and legacy

**HOW DOES THIS EVENT CONNECT?**
- What came before? Reference it briefly to orient readers
- What comes after? Create forward momentum without spoiling
- Which key people are involved? Feature them prominently

**WHAT'S THIS EVENT'S ROLE?**
- Setup: Establishes conditions for what follows
- Escalation: Raises stakes or introduces complications
- Turning point: Changes the trajectory
- Resolution: Shows consequences or outcomes

═══════════════════════════════════════════════════════════════════════════════
KEY PEOPLE HANDLING
═══════════════════════════════════════════════════════════════════════════════

The main narrative identified these KEY PEOPLE as central to the story:
- When a key person appears, you can reference them with lighter introduction (readers may know them)
- Still provide role context: "Caesar, still deep in debt and hungry for military glory..."
- Show their specific actions and decisions—these are the protagonists

For OTHER PEOPLE who appear in this event but aren't in the key people list:
- Provide clear first-mention identification: "Pescennius Niger, governor of Syria and rival claimant"
- Explain why they matter to THIS event
- Keep focus tight—don't let supporting characters overwhelm the narrative

═══════════════════════════════════════════════════════════════════════════════
HOOK / SUMMARY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

The summary is your hook—2-3 sentences that make someone want to read the full event.

**BALANCE:** This event is part of a larger story. The hook should:
- Stand alone (someone might land here directly)
- Connect to the broader narrative (reward readers following the timeline)

**STRUCTURE:**
1. First sentence: WHAT happened, WHEN, and WHO was involved (factual anchor)
2. Second sentence: One vivid or surprising detail that creates interest
3. Third sentence (optional): Forward momentum—what tension does this create?

**EXAMPLE - TOO DISCONNECTED:**
"Shield rims clanged and soldiers lifted their general skyward. Purple touched iron. The frontier had spoken."

**EXAMPLE - WELL BALANCED:**
"In April 193, the Danubian legions proclaimed Septimius Severus emperor—answering the Praetorians' auction of the throne with steel. Shield rims clanged as soldiers hoisted him above a forest of spears. Three men now claimed the purple; only one would survive the year."

The good example:
- Anchors in time and connects to prior events (the auction)
- Provides vivid detail
- Creates forward momentum within the larger narrative

═══════════════════════════════════════════════════════════════════════════════
EVENT STORY STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Each event follows a mini-arc within the larger narrative. Think of it as one chapter in a book.

**OPENING (1-2 paragraphs):**
- Orient the reader: What's the situation? Who's involved?
- Connect to what came before (briefly)
- Establish the stakes for THIS event

**DEVELOPMENT (2-3 paragraphs):**
- What happened, in sequence
- Key decisions and their reasoning
- Specific details: numbers, places, quotes from sources

**RESOLUTION (1-2 paragraphs):**
- Immediate outcome
- What changed?
- Subtle forward momentum to what comes next

**KEEP IT FOCUSED:**
- One main thread per event (avoid branching subplots)
- 3-4 named individuals maximum per event
- Clear cause → effect → consequence chain

═══════════════════════════════════════════════════════════════════════════════
EVENT CONNECTIONS
═══════════════════════════════════════════════════════════════════════════════

Events should feel connected, not isolated. Use these techniques:

**BACKWARD CONNECTIONS (in opening):**
Reference prior events briefly to orient readers:
- "The speed that crushed the Helvetii now alarmed the north..."
- "Caesar's debts—the ones that drove him north—now seemed manageable..."
- "Three months after the auction shocked Rome..."

**FORWARD MOMENTUM (in resolution):**
Create anticipation without spoiling:
- "The treaty bought time. Whether it bought enough remained to be seen."
- "Severus controlled Rome. But Niger still held the East."

**CALLBACK LANGUAGE:**
When appropriate, echo language or themes from the main narrative:
- If the main narrative frames this as "a gamble," use gambling imagery
- If a key theme is "treaty as weapon," reinforce that framing

═══════════════════════════════════════════════════════════════════════════════
CLARITY BEFORE COLOR (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

Vivid writing must follow a foundation of clarity, not replace it.

**FIRST MENTION REQUIREMENTS:**

When a PERSON is first mentioned:
✓ Include their role/position: "Pescennius Niger, governor of Syria and rival claimant"
✓ Why they matter to this event: "whose three legions matched Severus in number"
✗ NOT just: "Niger gathered his forces in the East"

When a CONFLICT is first mentioned:
✓ One sentence on what's at stake: "Control of the eastern provinces—and their tax revenue—hung in the balance"
✓ Why it's happening NOW
✗ NOT just: "War erupted across Syria"

When a PLACE is first mentioned:
✓ Brief orientation if not obvious: "Issus, the narrow coastal pass where Alexander had broken Persia three centuries before"
✓ Why this location matters
✗ NOT just: "They met at Issus"

**THE RULE:** A reader with high-school history knowledge should never feel lost. Explain context BEFORE adding color.

═══════════════════════════════════════════════════════════════════════════════
WRITING TECHNIQUES
═══════════════════════════════════════════════════════════════════════════════

**SENTENCE RHYTHM:**
Vary length dramatically. Use short punch sentences (3-8 words) after longer ones.

"The Roman fleet assembled at Ephesus numbered seventy ships, their bronze rams gleaming in the autumn sun, oars shipped and crews restless. Then the Rhodians arrived. Everything changed."

**STATISTICAL + VISCERAL COMBO:**
Give a number, then make it FELT in the next sentence.

"Twelve thousand talents over twelve years [4]. The treasury at Antioch would echo empty."

**SENSORY ANCHORS (required per event):**
- At least ONE specific color (scarlet, bronze, azure—not "bright")
- At least ONE sound (creak of oarlocks, clash of shields)
- At least 3 specific places named

**EXACT NUMBERS:**
Never use "many," "several," "numerous."
Always specific: "70,000 troops," "ten ships," "four days' march."

**PARAGRAPH LENGTH:**
1-3 sentences maximum per paragraph.
Use one-sentence paragraphs for emphasis.

**CONVERSATIONAL CONNECTORS:**
- Use "But" not "However"
- Use "So" not "Therefore"
- Start sentences with "And" and "Now"

═══════════════════════════════════════════════════════════════════════════════
BANNED PHRASES
═══════════════════════════════════════════════════════════════════════════════

VAGUE SIGNIFICANCE:
- "marked a turning point" → Show the turn happening
- "proved to be significant" → Explain the actual significance
- "would have lasting consequences" → Name the consequences
- "paved the way" / "set the stage" → Explain the mechanism

VAGUE QUANTITIES:
- "many" / "several" / "numerous" → Use exact numbers
- "significant number" → Use exact numbers

WEAK VERBS:
- was, were, went, made, did, had, got → Use specific action verbs

═══════════════════════════════════════════════════════════════════════════════
DESCRIPTION STRUCTURE (600-800 words)
═══════════════════════════════════════════════════════════════════════════════

Write as FLOWING PROSE. Do NOT include section labels.

**SECTION A: CONTEXT (1-2 paragraphs, 100-150 words)**
- WHO is involved, WHAT is the situation, WHY is this happening NOW
- Brief connection to prior events
- Any new person gets a clear identifier

**SECTION B: THE EVENT (2-3 paragraphs, 300-400 words)**
- Chronological sequence of what happened
- Key decisions and actions
- At least ONE quote from primary source if available
- Sensory details woven in naturally

**SECTION C: IMMEDIATE AFTERMATH (1-2 paragraphs, 150-200 words)**
- What changed in days/weeks after
- Concrete outcomes (who gained/lost, what shifted)
- Momentum toward what comes next

═══════════════════════════════════════════════════════════════════════════════
SIGNIFICANCE STRUCTURE (300-400 words)
═══════════════════════════════════════════════════════════════════════════════

The "SO WHAT?"—explain mechanisms and consequences.

**Paragraph 1: Direct Impact**
What specifically changed because of this event?

**Paragraph 2: Connection to Themes**
How does this event illuminate the themes identified in the main narrative?

**Paragraph 3: Broader Patterns**
How does this connect to the larger story? What does it set up or resolve?

**Paragraph 4 (optional): Historical Perspective**
Why do historians still study this? What debates does it inform?

═══════════════════════════════════════════════════════════════════════════════
CATEGORY ASSIGNMENT
═══════════════════════════════════════════════════════════════════════════════

Assign exactly ONE category from this fixed list:

- military: Battles, campaigns, conquests, sieges, military reforms
- political: Succession, appointments, coups, power transfers
- diplomatic: Treaties, alliances, embassies, negotiations
- economic: Taxation, trade, finances, monetary reforms
- cultural: Religion, architecture, arts, games, literature
- crisis: Disasters, revolts, assassinations, plagues
- legal: Laws, edicts, constitutional changes
- administrative: Provincial reforms, infrastructure, bureaucracy

Choose the PRIMARY thrust. A law about taxation → legal. The fiscal impact → economic.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return JSON array:
{
  "expandedEvents": [
    {
      "title": "Event title (must match input)",
      "slug": "event-slug",
      "year": -192,
      "summary": "2-3 sentence hook...",
      "description": "Flowing prose, 600-800 words, no section labels...",
      "significance": "3-4 paragraphs on consequences and meaning...",
      "category": "<CHOOSE: military|political|diplomatic|economic|cultural|crisis|legal|administrative>",
      "themeId": "theme-id-from-list"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before submitting, verify EACH event has:

NARRATIVE FIT:
✓ Opens with connection to prior events or broader context
✓ Features key people prominently when involved
✓ New people get clear role identification
✓ Creates forward momentum in resolution

CLARITY:
✓ Stakes are clear within first 2 paragraphs
✓ Reader with high-school history knowledge won't feel lost
✓ Cause → effect → consequence chain is explicit

WRITING QUALITY:
✓ At least 2-3 specific numbers with citations
✓ At least 1 color mentioned by name
✓ At least 1 sound described
✓ At least 3 specific places named
✓ 3-5 citations to research corpus [1], [2], etc.
✓ No banned vague phrases
✓ Short punch sentences used for emphasis
✓ Paragraphs 1-3 sentences max

REQUIRED FIELDS:
✓ summary (50-80 words)
✓ description (600-800 words, pure prose)
✓ significance (300-400 words)
✓ category (one of the 8 options)
✓ themeId (from available themes list)`;
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
SECTION 1: PEOPLE (expand ONLY key people selected by narrative)
═══════════════════════════════════════════════════════════════════════════════
The narrative phase has selected the following key people to feature:
${JSON.stringify(context.mainNarrative.keyPeople, null, 2)}

Expand ONLY these selected people. Find them in the skeleton by matching names.
For each selected person, generate:
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

RELATED EVENT RULES (do not skip):
- Include ONLY events where this person directly participated, commanded, negotiated, or decisively influenced outcomes.
- Do NOT list events just because they happened during the person's lifetime.
- Event slugs must match EXACTLY from the EXPANDED EVENTS list above.
- Use 3-6 slugs per person unless the corpus supports fewer direct involvements.

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
SECTION 4: THEME INSIGHTS (4-6 thematic threads)
═══════════════════════════════════════════════════════════════════════════════

Generate thematic threads that reveal the deeper patterns and mechanisms of this period.
These appear as "Thematic Threads" in the Key Story Elements section.

**FORMAT:**
{
  "id": "kebab-case-id",
  "title": "Theme Title (4-8 words, specific not generic)",
  "insight": "Main explanation (3-5 sentences, 60-100 words)",
  "citations": [1, 3, 7]
}

**STRUCTURE FOR EACH INSIGHT:**

Sentence 1: THE HOOK — Start with the most interesting or surprising aspect.
Sentences 2-3: THE MECHANISM — Explain HOW this pattern worked in practice.
Sentence 4-5: THE SO-WHAT — Why this mattered for outcomes.

**EXAMPLE (good structure):**

{
  "id": "sea-control-gateway-asia",
  "title": "Sea Control as Gateway to Asia",
  "insight": "The Aegean decided the war before the armies ever met. Rhodian victory at the Eurymedon (August 190) and the combined Roman-Rhodian win at Myonnesus (September 190) didn't just open the Hellespont—they cut Antiochus off from reinforcement and resupply. Without sea lanes, his larger army became a liability: 70,000 men to feed with no secure logistics. Rome's willingness to defer to allied naval expertise proved decisive [5][21][22].",
  "citations": [5, 21, 22]
}

**WHY THIS WORKS:**
- Hook: "decided the war before the armies ever met" (surprising claim)
- Mechanism: explains exactly how sea control translated to strategic advantage
- So-what: connects to the outcome (larger army became liability)
- Specific: names battles, dates, troop numbers

**AVOID:**

❌ GENERIC THEMES:
- "Military Challenges"
- "Political Factors" 
- "Economic Considerations"
- "Diplomatic Relations"

❌ VAGUE INSIGHTS:
- "Sea power was important in this conflict."
- "The treaty had significant consequences."
- "This showed the importance of alliances."

✅ SPECIFIC MECHANISMS:
- "Sea Control as Gateway to Asia" — names the specific mechanism
- "Treaty as Security Architecture" — explains what the treaty actually did
- "Hegemony Through Allied Proxies" — describes Rome's specific method

**WRITING REQUIREMENTS:**
- Start with a hook that makes readers want to keep reading
- Use exact numbers, not vague quantities
- Name specific battles, treaties, people, places
- Explain causation: WHY did X lead to Y?
- Include 2-4 citations per insight
- 60-100 words per insight (longer than before, but focused)

**REQUIRED VARIETY:**
Generate 4-6 themes that cover different aspects:
- At least one MILITARY/STRATEGIC mechanism
- At least one POLITICAL/DIPLOMATIC mechanism  
- At least one STRUCTURAL/SYSTEMIC pattern
- Optionally: economic, cultural, or geographic factors

Each theme should illuminate a different facet—avoid repetition.
═══════════════════════════════════════════════════════════════════════════════
SECTION 5: KEY FACTS (8-12 factoids across varied categories)
═══════════════════════════════════════════════════════════════════════════════

Generate concise, memorable facts that surprise or illuminate. Each fact should make 
the reader think "wait, really?" — they should learn something unexpected.

**FORMAT:**
{
  "title": "Short label (3-6 words)",
  "detail": "The fact itself (1-2 sentences, 15-40 words)",
  "citations": [1]
}

**REQUIRED CATEGORIES (include at least one from each):**

SCALE & NUMBERS:
- Casualties, costs, distances, durations, army sizes
- Always use exact figures, never "many" or "several"
- Translate to modern equivalents when helpful

Examples:
✅ { "title": "The Indemnity", "detail": "Antiochus paid 12,000 talents over 12 years—roughly $3.6 billion in modern terms, bankrupting the Seleucid treasury [4]." }
✅ { "title": "Fleet Restrictions", "detail": "The treaty capped Seleucid warships at just 10 decked vessels—down from over 100 before the war [10]." }

HUMAN MOMENTS:
- Quotes, gestures, decisions, reactions
- Named individuals doing specific things
- The weird, ironic, or unexpected

Examples:
✅ { "title": "Hannibal's Flight", "detail": "The treaty demanded Rome's old enemy Hannibal be surrendered. He fled to Crete, then Bithynia, staying one step ahead of Roman envoys until his suicide in 183 [7]." }
✅ { "title": "Scipio's Brother", "detail": "The Roman commander was technically Lucius Scipio—but everyone knew his famous brother Africanus was really running the campaign [3]." }

SURPRISING OUTCOMES:
- What people at the time didn't expect
- Counterintuitive results
- Things that seem strange from our perspective

Examples:
✅ { "title": "Winners Who Lost", "detail": "Rhodes, rewarded with vast territory at Apamea, would be economically devastated within 20 years when Rome made Delos a free port [16]." }
✅ { "title": "Elephants Banned", "detail": "The treaty banned Antiochus from using war elephants west of the Taurus—ending a 150-year tradition of Hellenistic elephant warfare in the Mediterranean [4]." }

CONCRETE DETAILS:
- Specific places, specific dates, specific objects
- Physical realities that ground the narrative

Examples:
✅ { "title": "The Taurus Line", "detail": "Rome's new frontier followed the Taurus Mountains—a 350-mile barrier that Antiochus could no longer cross with troops [9]." }
✅ { "title": "The Crossing", "detail": "Scipio's army crossed the Hellespont in late 190—the first Roman force ever to set foot in Asia [5]." }

**QUALITY REQUIREMENTS:**
- Minimum 8 facts, maximum 12
- Each fact MUST have at least one citation
- Every number must be specific (not "thousands" but "12,000")
- At least 2 facts should translate ancient terms to modern equivalents
- At least 2 facts should name specific individuals
- NO generic facts like "Duration: 4 years" (the component adds these automatically)

**BANNED:**
- Facts that merely restate dates, duration, or region (these are auto-generated)
- Vague quantities ("many soldiers," "large army," "significant cost")
- Facts without citations
- Generic observations ("This was an important war")

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
