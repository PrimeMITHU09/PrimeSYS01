const storyData = {
  Funny: {
    protagonists: [
      "a clumsy suburban dad trying to go viral", 
      "a sarcastic barista who hates coffee", 
      "a failed magician working at a drive-thru", 
      "an overly competitive PTA mom",
      "a dog that can telepathically communicate but only complains",
      "a Gen-Z intern managing a boomer CEO"
    ],
    antagonists: [
      "a hyper-aggressive local HOA president", 
      "a rival TikToker with zero talent", 
      "an artificially intelligent smart fridge that went rogue", 
      "a highly organized flock of seagulls",
      "a demanding mother-in-law visiting for the weekend"
    ],
    settings: ["a chaotic suburban neighborhood in Ohio", "a trendy but overpriced cafe in Brooklyn", "a disastrous family reunion in Florida", "a malfunctioning smart-home in Silicon Valley"],
    incidents: [
      "accidentally sends a highly embarrassing text to their boss.", 
      "wins the lottery but the ticket is eaten by a goat.", 
      "gets stuck in a mascot costume right before a first date.",
      "is mistaken for a famous celebrity and goes along with it."
    ],
    twists: [
      "The dog was actually the mastermind behind the chaos.",
      "The rival was secretly their biggest fan.",
      "They didn't win the lottery, they were reading yesterday's numbers."
    ]
  },
  Thriller: {
    protagonists: [
      "a disgraced NYPD detective", 
      "a brilliant but paranoid cybersecurity expert", 
      "a grief-stricken mother searching for answers", 
      "a late-night radio host who hears too much",
      "an insomniac Uber driver in Chicago"
    ],
    antagonists: [
      "a calculated serial killer who leaves no trace", 
      "a corrupt politician burying a dark secret", 
      "a wealthy elite who hunts people for sport", 
      "their own fractured mind and repressed memories"
    ],
    settings: ["the rainy, neon-lit streets of Seattle", "an isolated, snowed-in cabin in the Colorado Rockies", "a high-security psychiatric facility", "a dimly lit underground parking garage in Manhattan"],
    incidents: [
      "discovers a cryptic video file on a used laptop.",
      "witnesses a murder through their apartment window.",
      "wakes up covered in blood with no memory of the last 48 hours.",
      "receives a phone call from someone who died five years ago."
    ],
    twists: [
      "The protagonist was the killer all along (split personality).",
      "The victim never existed; it was an elaborate psychological test.",
      "The authorities were funding the antagonist's operations."
    ]
  },
  SciFi: {
    protagonists: ["a rogue AI programmer", "a scavenger on a dystopian wasteland", "a Mars colony engineer", "a time-traveling historian"],
    antagonists: ["a mega-corporation that owns oxygen rights", "a hive-mind alien species", "a corrupted version of their future self", "a rogue military android"],
    settings: ["a neon-drenched cyberpunk city in 2089", "a failing orbital space station", "the dusty, red dunes of a terraformed Mars", "a virtual reality utopia hiding a dark truth"],
    incidents: ["finds a piece of tech that alters human consciousness.", "receives a distress signal from a ship that disappeared 100 years ago.", "discovers a glitch in the simulation of reality."],
    twists: ["Earth was destroyed centuries ago; they are on a massive generation ship.", "The 'aliens' are actually highly evolved humans from the future.", "They are living in a simulation designed to harvest their emotions."]
  },
  Horror: {
    protagonists: ["a skeptical paranormal investigator", "a family moving into their dream home", "a group of college students on a road trip", "a night-shift security guard at an abandoned mall"],
    antagonists: ["an ancient demonic entity", "a vengeful spirit of a wrongfully accused witch", "a cult that worships cosmic horrors", "a shape-shifting creature mimicking their loved ones"],
    settings: ["a decaying Victorian mansion in Massachusetts", "a foggy, isolated logging town in Oregon", "an abandoned asylum with a dark history", "a deep, unmapped cave system in the Appalachians"],
    incidents: ["finds a hidden basement filled with strange occult symbols.", "plays a cursed VHS tape found in the attic.", "accidentally reads from a forbidden book during a party."],
    twists: ["The house isn't haunted, the protagonist is the ghost haunting the new family.", "The monster is a manifestation of the protagonist's own guilt.", "The cult's prophecy was actually trying to stop the end of the world, and the protagonist ruined it."]
  },
  Action: {
    protagonists: ["a retired Special Forces operative", "an underground street racer", "a rogue CIA agent", "a highly skilled jewel thief"],
    antagonists: ["a ruthless arms dealer", "a rogue military general plotting a coup", "a billionaire tech mogul with a private army", "the head of a massive international crime syndicate"],
    settings: ["the bustling streets of Tokyo", "a moving bullet train across Europe", "a heavily fortified skyscraper in Dubai", "a hidden cartel compound deep in the jungle"],
    incidents: ["is framed for the assassination of a foreign diplomat.", "has their family taken hostage to force them into one last job.", "intercepts a stolen nuclear code briefcase."],
    twists: ["The agency that hired them is actually the terrorist group.", "The hostage was working with the kidnappers all along.", "The nuclear codes were fake, meant to draw out a mole."]
  },
  Romance: {
    protagonists: ["a workaholic wedding planner", "a struggling artist in the big city", "a cynical divorce lawyer", "a small-town bakery owner"],
    antagonists: ["a demanding ex-fiancé", "a ruthless corporate developer trying to buy their town", "their own fear of commitment and past trauma", "a rival business owner"],
    settings: ["a picturesque snowy town in Vermont", "a bustling coffee shop in Seattle", "a romantic summer retreat in Tuscany", "a high-stress corporate law firm in New York"],
    incidents: ["is forced to share a cabin with their childhood rival due to a booking error.", "spills coffee on a handsome stranger who turns out to be their new boss.", "enters a fake-dating arrangement to appease their family."],
    twists: ["The rival developer is actually their anonymous online pen pal.", "They realize their 'perfect' fake date is actually perfect for them.", "The ex returns, but they realize they've outgrown the past."]
  },
  Crime: {
    protagonists: ["a seasoned FBI profiler", "a relentless investigative journalist", "a forensic accountant tracking dirty money", "a small-town sheriff with a dark past"],
    antagonists: ["a brilliant cartel money launderer", "a highly organized crime family boss", "a seemingly perfect suburban neighbor with a secret basement", "a corrupt police captain"],
    settings: ["the gritty, rain-slicked streets of Chicago", "a seemingly idyllic gated community in California", "a remote desert town in New Mexico hiding smuggling routes", "the high-stakes financial district of Wall Street"],
    incidents: ["discovers a discrepancy in the books that points to a billion-dollar fraud.", "finds a severed hand in a local fishing trap.", "is given an anonymous tip that implicates the mayor in a murder."],
    twists: ["The person feeding them tips is actually the true mastermind eliminating rivals.", "The victim faked their death to escape the mob.", "The corrupt captain is the protagonist's own father."]
  }
};

const visualStyles = [
  "Cinematic lighting, hyper-realistic, 8k resolution, volumetric fog, Unreal Engine 5 render, dramatic shadows, highly detailed.",
  "Neo-noir aesthetic, neon pink and blue lighting, cyberpunk city background, highly detailed, photorealistic, anamorphic lens flare.",
  "Vintage 1970s film grain, warm nostalgic lighting, Kodak Portra 400 style, cinematic composition, soft focus.",
  "Dark and moody, gothic atmosphere, moonlight casting long shadows, highly detailed textures, 8k, photorealistic.",
  "Vibrant colors, high contrast, dynamic action angle, comic-book movie aesthetic, shallow depth of field.",
  "Documentary style, gritty realism, handheld camera feel, natural lighting, highly textured.",
  "Ethereal and dreamy, soft pastel colors, glowing light sources, fantasy illustration style, highly intricate."
];

function getRandom(arr) {
  // Use crypto for better randomness to ensure "lifetime no repeats" feel
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  const randomIndex = randomBuffer[0] % arr.length;
  return arr[randomIndex];
}

function generateRandomCombination(genreKey) {
  let selectedGenre = genreKey;
  if (genreKey === "Random" || !storyData[genreKey]) {
    const keys = Object.keys(storyData);
    selectedGenre = getRandom(keys);
  }

  const data = storyData[selectedGenre];
  return {
    genre: selectedGenre,
    protag: getRandom(data.protagonists),
    antag: getRandom(data.antagonists),
    setting: getRandom(data.settings),
    incident: getRandom(data.incidents),
    twist: getRandom(data.twists),
    visual: getRandom(visualStyles)
  };
}

function generatePrompts(format, genreKey) {
  const elements = generateRandomCombination(genreKey);
  
  // Randomly generate a compelling title
  const titleAdjectives = ["The Silent", "A Broken", "Midnight", "The Last", "Echoes of", "Shadows in", "The Neon", "Crimson"];
  const titleNouns = ["Paradox", "Deception", "Stranger", "Reckoning", "Symphony", "Illusion", "Whisper", "Syndicate"];
  const title = `${getRandom(titleAdjectives)} ${getRandom(titleNouns)}`;

  const logline = `Set in ${elements.setting}, ${elements.protag} ${elements.incident} Now, they must face off against ${elements.antag} before it's too late.`;

  let storyPrompt = "";
  
  if (format === "short") {
    // 60-second Reels/Shorts Format
    storyPrompt = `**Title:** ${title}
**Format:** YouTube Short / TikTok / IG Reel (60 Seconds)
**Genre:** ${elements.genre}
**Target Audience:** USA (High-retention, fast-paced)

**Logline:** 
${logline}

**Script & Scene Breakdown:**
- **[0:00 - 0:05] The Hook:** Fast-paced establishing shot of ${elements.setting}. VO (Voice Over): "What would you do if you realized your whole life was a lie?"
- **[0:05 - 0:15] The Setup:** Show ${elements.protag}. They are living a normal life until BAM—they ${elements.incident.replace('discovers', 'discover').replace('witnesses', 'witness').replace('wakes', 'wake')}.
- **[0:15 - 0:35] The Escalation:** Quick cuts of rising tension. They realize they are being hunted/targeted by ${elements.antag}. Fast music, heartbeat sound effects.
- **[0:35 - 0:50] The Climax/Twist:** The confrontation. Right when all seems lost, hit the audience with the twist: *${elements.twist}*
- **[0:50 - 1:00] The Call to Action:** Cliffhanger ending. VO: "Like and subscribe for Part 2 to see how it ends!"`;

  } else if (format === "mid") {
    // 5-10 Minute Mid-Length Format
    storyPrompt = `**Title:** ${title}
**Format:** Mid-Length YouTube Video (5-10 Minutes)
**Genre:** ${elements.genre}
**Target Audience:** USA (Storytime, Mini-Doc, or Short Film style)

**Logline:** 
${logline}

**Act 1: The Normal World & The Incident**
- Introduce ${elements.protag} in their natural element: ${elements.setting}.
- Establish their goals and flaws.
- **The Inciting Incident:** Everything changes when they ${elements.incident}

**Act 2: The Rising Action & Confrontation**
- The protagonist tries to solve the problem but makes things worse.
- Enter ${elements.antag}. The stakes are raised.
- A major confrontation occurs midway through the story, forcing the protagonist to retreat and rethink their strategy.

**Act 3: The Climax & The Twist**
- The protagonist gathers their resolve for the final battle/confrontation against ${elements.antag}.
- Just when it looks like they have won (or lost), the massive twist is revealed: *${elements.twist}*
- Resolution: A bittersweet or shocking ending leaving the audience thinking.`;

  } else {
    // 20 Minute Full Video Format
    storyPrompt = `**Title:** ${title}
**Format:** Full Video / Mini-Movie (20 Minutes)
**Genre:** ${elements.genre}
**Target Audience:** USA (Deep dive, cinematic storytelling, Netflix-style pacing)

**Logline:** 
${logline}

**Detailed Scene Breakdown (20-Minute Pacing):**

**[Minute 0-3] Introduction & The Hook**
- **Scene 1:** Cinematic intro to ${elements.setting}. Establish the mood.
- **Scene 2:** Introduce ${elements.protag}. Show, don't just tell, their personality and current life situation.

**[Minute 3-7] The Catalyst**
- **Scene 3:** The Inciting Incident occurs. They ${elements.incident}
- **Scene 4:** Denial/Confusion. They try to ignore it or misunderstand the gravity of the situation.

**[Minute 7-12] Crossing the Threshold**
- **Scene 5:** They can no longer ignore it. They actively engage with the mystery/conflict.
- **Scene 6:** First encounter with the presence of ${elements.antag}. The stakes are established (life, death, love, or freedom).

**[Minute 12-16] The Dark Night of the Soul**
- **Scene 7:** A major failure. ${elements.antag} outsmarts or overpowers them. All hope seems lost.
- **Scene 8:** A moment of reflection. The protagonist realizes what they must do to win.

**[Minute 16-19] The Climax & The Twist**
- **Scene 9:** The final, desperate confrontation. High action/tension.
- **Scene 10:** The Twist Reveal! *${elements.twist}* The entire context of the story changes in an instant.

**[Minute 19-20] The Aftermath**
- **Scene 11:** The resolution. The protagonist's life is forever changed. Fade to black.`;
  }

  // --- Image & Character Prompts ---
  const imagePrompt = `**Main Character Design (For Midjourney/DALL-E):**
Prompt: A cinematic portrait of ${elements.protag}, intense expression, detailed facial features. Background is ${elements.setting}. ${elements.visual} --ar 9:16 --v 6.0

**Antagonist Design:**
Prompt: A shadowy, menacing portrait of ${elements.antag}, looking directly at the camera. Intimidating posture. ${elements.visual} --ar 9:16 --v 6.0

**Key Scene Concept Art (The Incident):**
Prompt: A dramatic wide shot. ${elements.protag} at the exact moment they ${elements.incident.replace('discovers', 'discover')} Background: ${elements.setting}. ${elements.visual} --ar 16:9 --v 6.0

**Key Scene Concept Art (The Twist/Climax):**
Prompt: A shocking, highly emotional scene depicting the revelation that *${elements.twist}* Dynamic lighting, emotional weight. ${elements.visual} --ar 16:9 --v 6.0`;

  return { storyPrompt, imagePrompt };
}

function initStoryGenerator() {
  const generateBtn = document.getElementById('generateStoryBtn');
  const copyStoryBtn = document.getElementById('copyStoryBtn');
  const copyImageBtn = document.getElementById('copyImageBtn');
  
  const storyOutputArea = document.getElementById('storyOutputArea');
  const imageOutputArea = document.getElementById('imageOutputArea');
  
  const formatSelect = document.getElementById('storyFormatSelect');
  const genreSelect = document.getElementById('storyGenreSelect');

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const format = formatSelect ? formatSelect.value : 'short';
      const genre = genreSelect ? genreSelect.value : 'Random';
      
      const prompts = generatePrompts(format, genre);
      
      storyOutputArea.innerText = prompts.storyPrompt;
      imageOutputArea.innerText = prompts.imagePrompt;
      
      storyOutputArea.setAttribute('data-raw', prompts.storyPrompt);
      imageOutputArea.setAttribute('data-raw', prompts.imagePrompt);
      
      copyStoryBtn.style.display = 'inline-block';
      copyImageBtn.style.display = 'inline-block';
    });
  }

  // Helper for copy buttons
  function setupCopyBtn(btn, area) {
    if (btn && area) {
      btn.addEventListener('click', () => {
        const rawText = area.getAttribute('data-raw');
        if (rawText) {
          navigator.clipboard.writeText(rawText);
          const originalText = btn.innerText;
          btn.innerText = "Copied!";
          setTimeout(() => {
            btn.innerText = originalText;
          }, 2000);
        }
      });
    }
  }

  setupCopyBtn(copyStoryBtn, storyOutputArea);
  setupCopyBtn(copyImageBtn, imageOutputArea);
}

document.addEventListener("DOMContentLoaded", initStoryGenerator);
