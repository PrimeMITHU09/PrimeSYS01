const storyData = {
  genres: ["Psychological Thriller", "Sci-Fi Cyberpunk", "Romantic Comedy", "Supernatural Horror", "True Crime / Detective", "Action & Adventure", "Teen Drama"],
  protagonists: [
    "a burnt-out NYPD detective", 
    "a charismatic tech CEO from Silicon Valley", 
    "a struggling waitress in a small Texas diner", 
    "an ambitious Harvard law student", 
    "a former Navy SEAL living off-grid in Montana", 
    "a popular high school quarterback in Ohio", 
    "an investigative journalist in Chicago"
  ],
  antagonists: [
    "a brilliant but psychopathic serial killer", 
    "a corrupt politician running for Senate", 
    "a rogue AI system controlling the city's grid", 
    "a secret society of wealthy elites", 
    "an obsessive stalker with tech skills", 
    "a rival cartel boss from Miami"
  ],
  settings: [
    "the neon-lit streets of downtown Los Angeles", 
    "a snowy, isolated cabin in the Colorado Rockies", 
    "the busy subways of New York City", 
    "a wealthy suburb in Connecticut", 
    "the sweltering swamps of Louisiana", 
    "a high-tech corporate campus in San Francisco", 
    "a quiet, creepy farming town in the Midwest"
  ],
  incitingIncidents: [
    "discovers a hidden flash drive containing government secrets.",
    "witnesses a murder through their apartment window.",
    "inherits a haunted mansion from an unknown relative.",
    "gets trapped inside a bank during a high-stakes heist.",
    "receives a text message from someone who died 5 years ago.",
    "wakes up with no memory, holding a smoking gun."
  ],
  plotTwists: [
    "The protagonist was actually the villain the entire time.",
    "The victim staged their own death to frame the protagonist.",
    "It was all a simulation designed to test their morality.",
    "The antagonist is actually the protagonist's long-lost sibling.",
    "The authorities were in on the conspiracy from the beginning."
  ],
  visualStyles: [
    "Cinematic lighting, hyper-realistic, 8k resolution, volumetric fog, Unreal Engine 5 render, dramatic shadows.",
    "Neo-noir aesthetic, neon pink and blue lighting, cyberpunk city background, highly detailed, photorealistic.",
    "Vintage 1970s film grain, warm nostalgic lighting, Kodak Portra 400 style, cinematic composition.",
    "Dark and moody, gothic atmosphere, moonlight casting long shadows, highly detailed textures, 8k."
  ]
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStoryPrompt() {
  const genre = getRandom(storyData.genres);
  const protag = getRandom(storyData.protagonists);
  const antag = getRandom(storyData.antagonists);
  const setting = getRandom(storyData.settings);
  const incident = getRandom(storyData.incitingIncidents);
  const twist = getRandom(storyData.plotTwists);
  const visual = getRandom(storyData.visualStyles);

  const title = `The ${setting.split(' ').pop()} Paradox`;

  const logline = `Set in ${setting}, ${protag} ${incident} Now, they must face off against ${antag} before it's too late.`;

  const scene1 = `**Scene 1 (The Hook):** Establishing shot of ${setting}. The protagonist is going about their normal life until they ${incident.replace('discovers', 'discover').replace('witnesses', 'witness').replace('inherits', 'inherit').replace('gets', 'get').replace('receives', 'receive').replace('wakes', 'wake')}.`;
  
  const scene2 = `**Scene 2 (The Confrontation):** Tension builds as the protagonist crosses paths with ${antag}. A high-stakes confrontation occurs, revealing that things are much more dangerous than they seemed.`;
  
  const scene3 = `**Scene 3 (The Climax & Twist):** The final battle/showdown. Just when the protagonist thinks they have won, the massive twist is revealed: *${twist}*`;

  const midjourneyPrompt = `**Midjourney/AI Image Prompt:** A cinematic wide shot of ${protag} in ${setting}, facing ${antag}. ${visual} --ar 16:9 --v 6.0`;

  const fullPrompt = `
**Title:** ${title}
**Genre:** ${genre}
**Target Audience:** USA (Netflix / Hollywood Style)

**Logline:** 
${logline}

**Story Progression:**
${scene1}

${scene2}

${scene3}

${midjourneyPrompt}
  `.trim();

  return fullPrompt;
}

function initStoryGenerator() {
  const generateBtn = document.getElementById('generateStoryBtn');
  const copyBtn = document.getElementById('copyStoryBtn');
  const outputArea = document.getElementById('storyOutputArea');

  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      const promptText = generateStoryPrompt();
      outputArea.innerText = promptText;
      outputArea.setAttribute('data-raw', promptText);
      copyBtn.style.display = 'inline-block';
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const rawText = outputArea.getAttribute('data-raw');
      if (rawText) {
        navigator.clipboard.writeText(rawText);
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initStoryGenerator);
