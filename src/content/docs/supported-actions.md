---
title: Supported actions
description: What Darwin-preview-1.3B can and cannot detect — the honest capability list, including the full action vocabulary and known gaps.
order: 25
section: Guides
---

# Supported actions

This page is the honest capability list for **Darwin-preview-1.3B** (status: preview). It documents what the model can reliably detect, what it detects with reduced accuracy, and what it cannot detect at all — so you can design prompts that work instead of discovering the limits by trial and error.

**Preview means early access**: detection quality and the set of reliably detected actions are still evolving, and results may improve or change between checkpoint updates. The API contract (request/response shapes, billing) is stable.

If an analysis returns `answer: "indeterminate"` with `indeterminate_reason: "unsupported_query_form"`, or an action prompt produces a nonsensical match, this page explains why — and what to ask instead.

## Summary: what works, by prompt type

| Prompt type | Example | Reliability |
|---|---|---|
| **Presence** | "Is there a person?" | Stable — most reliable query form |
| **Absence** | "Are there no dogs?" | Stable |
| **Count** (bare + threshold) | "How many people?" / "More than 2 people?" | Stable on clips; not long multi-hour footage |
| **Compound** | "Is there a person AND a dog?" | Stable |
| **Attribute** | "Is anyone wearing a red jacket?" | Stable |
| **Location** | "Where is the dog?" | Stable |
| **State** | "Is the door open?" | Stable |
| **Segment** | "Show me where the person is" | Stable (returns masks) |
| **Action** | "Is someone walking?" | **Beta** — see the vocabulary below |
| **Open-ended** | "Tell me what you see" | Rejected at zero cost (`unsupported_query_form`) |

Presence, counting, attribute, location, state, and segmentation queries recognize the visual world broadly — common objects, people, animals, vehicles, scenes. They are not limited to a fixed list. **Action queries are different**: they run against a fixed action vocabulary, and that is where the honest limits live.

## How action detection works — and why the vocabulary matters

When you ask an action question ("Is someone running?", "Does anyone fall down?"), the model matches what it sees against a **fixed vocabulary of 532 action classes** (Kinetics-derived). Two consequences:

1. **In-vocabulary actions** can be detected, at beta accuracy. Short clips, fast motion, and unusual camera angles reduce reliability.
2. **Out-of-vocabulary actions cannot be detected.** The model has no embedding for the action, so it falls back to the nearest in-vocabulary neighbour — which can produce confidently wrong or nonsensical matches. If the action you care about is not in the list below, do not ship a decision on the result.

When the system can tell at submit time that a requested action is outside the vocabulary, the API flags it (see [Unsupported action signal](#unsupported-action-signal) below). When it cannot tell, you may still get a low-quality nearest-neighbour result — treat unexpected action answers with suspicion and check this list.

## Known gaps (confirmed, tracked)

These are actions users commonly ask about that the current vocabulary does **not** cover:

- **Hand gestures** — thumbs up, thumbs down, OK sign, peace sign. (Exception: `waving hand`, `finger snapping`, `clapping`-family classes exist.) Gesture prompts currently produce unreliable nearest-neighbour matches.
- **Most vehicle actions** — the vocabulary contains `driving car`, `driving tractor`, `motorcycling`, `riding scooter`, `riding a bike`, `riding mountain bike`, and `pushing car`. Essentially everything else is missing: parking, reversing, lane changes, braking, turning, overtaking, collisions/crashes, honking, loading/unloading, towing. Treat vehicle-action prompts (beyond basic "driving") as **not detected**.
- **Everyday ambient actions phrased generically** — "walking" and "running" as bare actions are matched via the model's broader action understanding but the vocabulary's walking/running entries are context-specific (`walking the dog`, `running on treadmill`, `jogging`). Generic phrasings usually work but are beta-accuracy; be specific where you can.

Vocabulary expansion (a ~5,000-action taxonomy with synonym grouping) is on the roadmap; this page tracks the current shipped reality.

## What is never supported (any prompt type)

- **Audio / sound** — "Is there loud noise?", "What did they say?"
- **Identity** — "Is this John?" (who, not what)
- **OCR / reading text in frame** — "What does the sign say?"
- **Subjective judgment** — "Does this look dangerous?", "Is the room clean?" (subjective terms are surfaced in `query.unassessable_components`)
- **Exhaustive counting over long footage** — counts are accurate on a clip or short segment, not a multi-hour archive

## Unsupported action signal

When prompt compilation determines the request cannot be scored, the API responds honestly instead of burning credits:

- **Open-ended prompts** are rejected at submit time, at zero cost: the analysis completes immediately with `answer: "indeterminate"`, `indeterminate_reason: "unsupported_query_form"`, and `confidence: 0`.
- Analyses whose result cannot be trusted carry an `indeterminate_reason` (`low_confidence`, `nothing_detected`, `unsupported_query_form`, `duration_mismatch`) — [full semantics in the prompts guide](/docs/guides/prompts).
- Responses in the unsupported path link back to this page so agents and users can see the capability list without guessing.

## The full action vocabulary (532 classes)

The complete, current list. If an action question maps to one of these, it is detectable (beta accuracy). If it does not, rephrase — often a **presence** question ("Is there a person on a ladder?") is more reliable than an action question ("Is someone climbing?").

**A** — `abseiling` · `acting in play` · `adjusting glasses` · `air drumming` · `answering questions` · `applauding` · `applying cream` · `archery` · `arm wrestling` · `arranging flowers` · `assembling computer` · `auctioning`

**B** — `baby waking up` · `baking cookies` · `balloon blowing` · `bandaging` · `barbequing` · `bartending` · `base jumping` · `bathing dog` · `beatboxing` · `bee keeping` · `belly dancing` · `bench pressing` · `bending back` · `bending metal` · `biking through mud` · `blasting sand` · `blowing glass` · `blowing leaves` · `blowing nose` · `blowing out candles` · `bobsledding` · `bookbinding` · `bouncing on trampoline` · `bowling` · `braiding hair` · `breading or breadcrumbing` · `breakdancing` · `brush painting` · `brushing hair` · `brushing teeth` · `building cabinet` · `building shed` · `bungee jumping` · `busking`

**C** — `canoeing or kayaking` · `capoeira` · `carrying baby` · `cartwheeling` · `carving pumpkin` · `catching fish` · `catching or throwing baseball` · `catching or throwing frisbee` · `catching or throwing softball` · `celebrating` · `changing oil` · `changing wheel` · `checking tires` · `cheerleading` · `chopping wood` · `clapping` · `clay pottery making` · `clean and jerk` · `cleaning floor` · `cleaning gutters` · `cleaning pool` · `cleaning shoes` · `cleaning toilet` · `cleaning windows` · `climbing a rope` · `climbing ladder` · `climbing tree` · `closing something` · `contact juggling` · `cooking chicken` · `cooking egg` · `cooking on campfire` · `cooking sausages` · `counting money` · `country line dancing` · `covering something` · `cracking neck` · `crawling baby` · `crossing river` · `crying` · `curling hair` · `cutting nails` · `cutting pineapple` · `cutting watermelon`

**D** — `dancing ballet` · `dancing charleston` · `dancing gangnam style` · `dancing macarena` · `deadlifting` · `decorating the christmas tree` · `digging` · `dining` · `disc golfing` · `diving cliff` · `dodgeball` · `doing aerobics` · `doing laundry` · `doing nails` · `drawing` · `dribbling basketball` · `drinking` · `drinking beer` · `drinking shots` · `driving car` · `driving tractor` · `drop kicking` · `drumming fingers` · `dunking basketball` · `dying hair`

**E** — `eating burger` · `eating cake` · `eating carrots` · `eating chips` · `eating doughnuts` · `eating hotdog` · `eating ice cream` · `eating spaghetti` · `eating watermelon` · `egg hunting` · `exercising arm` · `exercising with an exercise ball` · `extinguishing fire`

**F** — `faceplanting` · `feeding birds` · `feeding fish` · `feeding goats` · `felling tree` · `filling eyebrows` · `finger snapping` · `fixing hair` · `flipping pancake` · `fly tying` · `flying kite` · `folding clothes` · `folding napkins` · `folding paper` · `folding something` · `front raises` · `frying vegetables`

**G** — `gargling` · `getting a haircut` · `getting a tattoo` · `giving or receiving award` · `golf chipping` · `golf driving` · `golf putting` · `grinding meat` · `grooming dog` · `grooming horse` · `gymnastics tumbling`

**H** — `hammer throw` · `hand washing clothes` · `head stand` · `headbanging` · `headbutting` · `high jump` · `high kick` · `hitting baseball` · `hockey stop` · `holding something` · `holding something in front of something` · `holding something next to something` · `holding something over something` · `hoverboarding` · `hugging` · `hula hooping` · `hurdling` · `hurling sport`

**I** — `ice climbing` · `ice fishing` · `ice skating` · `ironing` · `ironing clothes`

**J** — `javelin throw` · `jetskiing` · `jogging` · `juggling balls` · `juggling fire` · `juggling soccer ball` · `jumping bicycle` · `jumping into pool` · `jumping jacks` · `jumping sofa` · `jumpstyle dancing`

**K** — `kicking field goal` · `kicking soccer ball` · `kissing` · `kitesurfing` · `knitting` · `krumping`

**L** — `laughing` · `laying bricks` · `laying stone` · `letting something roll down a surface` · `licking` · `lifting a surface with something on it` · `lifting hat` · `lifting something` · `lifting something up completely` · `lighting candle` · `lighting fire` · `lock picking` · `long jump` · `looking at phone` · `lunge`

**M** — `making a cake` · `making a sandwich` · `making bed` · `making jewelry` · `making pizza` · `making snowman` · `making sushi` · `making tea` · `marching` · `massaging back` · `massaging feet` · `massaging legs` · `massaging persons head` · `milking cow` · `mopping floor` · `motorcycling` · `moving child` · `moving furniture` · `moving something across a surface` · `moving something away from something` · `moving something closer to something` · `moving something down` · `moving something up` · `mowing lawn` · `mushroom foraging`

**N** — `news anchoring`

**O** — `opening bottle` · `opening door` · `opening present` · `opening something`

**P** — `packing` · `paragliding` · `parasailing` · `parkour` · `passing American football in game` · `passing American football not in game` · `peeling apple` · `peeling banana` · `peeling potatoes` · `petting animal not cat` · `petting cat` · `picking fruit` · `picking something up` · `pillow fight` · `pinching` · `plastering` · `playing accordion` · `playing badminton` · `playing bagpipes` · `playing basketball` · `playing bass guitar` · `playing cards` · `playing cello` · `playing chess` · `playing clarinet` · `playing controller` · `playing cricket` · `playing cymbals` · `playing didgeridoo` · `playing drums` · `playing flute` · `playing guitar` · `playing handball` · `playing harmonica` · `playing harp` · `playing ice hockey` · `playing keyboard` · `playing kickball` · `playing laser tag` · `playing monopoly` · `playing organ` · `playing paintball` · `playing piano` · `playing poker` · `playing recorder` · `playing saxophone` · `playing squash or racquetball` · `playing tennis` · `playing trombone` · `playing trumpet` · `playing ukulele` · `playing violin` · `playing volleyball` · `playing xylophone` · `plumbing` · `poaching eggs` · `poking something so it falls over` · `poking something so it slightly moves` · `pole vault` · `polishing furniture` · `polishing metal` · `popping balloons` · `pouring something into something` · `pouring something onto something` · `pretending to be a statue` · `pretending to pick something up` · `pretending to put something next to something` · `pretending to take something from somewhere` · `pretending to throw something` · `pull ups` · `pulling something from behind of something` · `pulling something from left to right` · `pulling something from right to left` · `pulling something onto something` · `pulling something out of something` · `pulling two ends of something so that it gets stretched` · `pumping fist` · `pumping gas` · `punching bag` · `punching person boxing` · `push up` · `pushing car` · `pushing something from left to right` · `pushing something from right to left` · `pushing something off of something` · `pushing something onto something` · `pushing something so it spins` · `pushing something so that it almost falls off but doesnt` · `pushing something so that it falls off the table` · `pushing something with something` · `pushing wheelchair` · `putting makeup on someone` · `putting on eyeliner` · `putting on foundation` · `putting on lipstick` · `putting on mascara` · `putting on shoes` · `putting something and something on the table` · `putting something behind something` · `putting something in front of something` · `putting something into something` · `putting something next to something` · `putting something on a flat surface without letting it roll` · `putting something on a surface` · `putting something on the edge of something so it is not supported and falls down` · `putting something onto a slanted surface but it doesnt glide down` · `putting something onto something` · `putting something similar to other things that are already on the table` · `putting something that cant roll onto a slanted surface so it slides down` · `putting something underneath something` · `putting something upright on the table`

**R** — `reading book` · `reading newspaper` · `recording music` · `removing something spreading it apart from something` · `riding a bike` · `riding camel` · `riding elephant` · `riding mechanical bull` · `riding mountain bike` · `riding mule` · `riding or walking with horse` · `riding scooter` · `riding snow blower` · `riding unicycle` · `ripping paper` · `robot dancing` · `rock climbing` · `rock scissors paper` · `roller skating` · `rolling eyes` · `rolling pastry` · `rolling something on a flat surface` · `rope pushdown` · `rowing boat` · `running on treadmill`

**S** — `sailing` · `salsa dancing` · `sanding floor` · `scrambling eggs` · `scuba diving` · `setting table` · `sewing` · `shaking hands` · `shaking head` · `shaking something` · `sharpening knives` · `sharpening pencil` · `shaving head` · `shaving legs` · `shearing sheep` · `shooting basketball` · `shooting goal soccer` · `shopping` · `shot put` · `shoveling snow` · `showing something behind something` · `showing something next to something` · `showing something on top of something` · `showing something to the camera` · `shredding paper` · `shuffling cards` · `side kick` · `sign language interpreting` · `singing` · `situp` · `skateboarding` · `ski ballet` · `ski jumping` · `skiing crosscountry` · `skiing mono` · `skiing slalom` · `skipping rope` · `skipping stone` · `skydiving` · `slacklining` · `slapping` · `sled dog racing` · `smoking` · `smoking hookah` · `snatch weight lifting` · `sneezing` · `sniffing` · `snorkeling` · `snowboarding` · `snowkiting` · `snowmobiling` · `somersaulting` · `spinning poi` · `spinning something so it continues spinning` · `spinning something that quickly stops spinning` · `spraying` · `springboard diving` · `squat` · `squeezing something` · `stacking something` · `stamping something` · `standing on hands` · `sticking something on something` · `sticking tongue out` · `stirring` · `stomping grapes` · `stretching arm` · `stretching leg` · `strumming guitar` · `stuffing something into something` · `surfing crowd` · `surfing water` · `sweeping floor` · `swimming backstroke` · `swimming breast stroke` · `swimming butterfly stroke` · `swing dancing` · `swinging legs` · `swinging on something` · `sword fighting` · `sword swallowing`

**T** — `tackling football` · `tai chi` · `taking a shower` · `taking photo` · `taking something from somewhere` · `taking something out of something` · `tango dancing` · `tap dancing` · `tapping guitar` · `tapping pen` · `tasting beer` · `tasting food` · `tasting wine` · `texting` · `throwing axe` · `throwing ball` · `throwing discus` · `throwing knife` · `throwing something` · `throwing something against something` · `throwing something in the air and catching it` · `throwing something in the air and letting it fall` · `throwing something onto a surface` · `tickling` · `tipping something over` · `tipping something with something in it over so everything falls out` · `tobogganing` · `tossing coin` · `tossing salad` · `training dog` · `trapezing` · `trimming or shaving beard` · `trimming trees` · `triple jump` · `tumbling something downwards` · `turning something upside down` · `turning the camera left while filming something` · `turning the camera right while filming something` · `tying bow tie` · `tying knot not on a+rope` · `tying shoe laces`

**U** — `uncovering something` · `unfolding something` · `using a power drill` · `using a wrench` · `using computer` · `using remote controller not gaming` · `using segway`

**V** — `vault` · `visiting museum`

**W** — `walking the dog` · `washing dishes` · `washing feet` · `washing hair` · `washing hands` · `water skiing` · `water sliding` · `watering plants` · `waving hand` · `waxing back` · `waxing chest` · `waxing eyebrows` · `waxing legs` · `weaving basket` · `welding` · `whistling` · `windsurfing` · `wiping something off of something` · `wrapping present` · `wrestling` · `writing`

**Y** — `yawning` · `yoga`

**Z** — `zumba`

---

*This list reflects the deployed vocabulary and updates when the model checkpoint updates. Last verified: 2026-08-01.*
