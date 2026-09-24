import type { BlogPost } from "../types";

export type BlogEditorialContent = {
  summary: string;
  context: string;
  story: string[];
  reflection: string;
  qualities: string[];
};

const editorialById: Record<number, BlogEditorialContent> = {
  21: {
    summary:
      "A demanding climb on one of Central Luzon's most recognizable peaks—an exercise in pacing, persistence, and earning every view.",
    context:
      "Mt. Arayat stands apart from the surrounding plains, which made the journey feel focused from the beginning: one mountain, one route, and a clear challenge ahead.",
    story: [
      "This was the kind of climb that made progress feel physical. The trail asked for patience, controlled pacing, and the willingness to keep moving even when the next section looked steeper than the last.",
      "Reaching the higher sections turned the effort into perspective. Looking back at the distance already covered was a reminder that difficult goals rarely feel dramatic while they are being completed—they are usually built one deliberate step at a time.",
    ],
    reflection:
      "Arayat reminded me that consistency is often more useful than intensity. The same principle guides how I approach difficult technical work: understand the next problem, make steady progress, and keep the larger objective in view.",
    qualities: ["Persistence", "Pacing", "Focus"],
  },
  20: {
    summary:
      "A group journey through Mt. Pinatubo's remarkable landscape, shaped by shared effort, changing terrain, and the reward of reaching the crater together.",
    context:
      "Mt. Pinatubo is as much about the route as the destination. The wide volcanic landscape makes the scale of the journey visible and gives every stage its own character.",
    story: [
      "Travelling with a group made this adventure a lesson in collective pacing. Everyone experiences a long route differently, so the journey worked best when we stayed aware of one another and treated progress as a shared responsibility.",
      "The changing terrain kept the day interesting and demanded attention. By the time we reached the destination, the most memorable part was not only the view—it was knowing that the group had moved through the entire experience together.",
    ],
    reflection:
      "Pinatubo reinforced the value of teamwork and communication. Strong teams do not simply move quickly; they keep people informed, adjust when conditions change, and make sure everyone can reach the outcome.",
    qualities: ["Teamwork", "Preparedness", "Patience"],
  },
  14: {
    summary:
      "A solo motorcycle journey to Baler and Dibut Beach that created space to slow down, reflect, and return with a clearer mind.",
    context:
      "Long rides have a rhythm of their own. Between the changing road, the coastline, and the quiet moments at the destination, this Aurora trip became more reflective than hurried.",
    story: [
      "The ride to Baler and Dibut Beach was not only about reaching another point on the map. It was time away from familiar routines—time to pay attention to the road, the surroundings, and thoughts that are easy to ignore on busy days.",
      "Travelling alone also meant owning every decision: when to continue, when to pause, and when to change the plan. That independence made the quiet parts of the trip just as valuable as the scenery.",
    ],
    reflection:
      "This journey reminded me that reflection is part of progress. Stepping away can reveal what needs attention, restore energy, and make the next decision more intentional.",
    qualities: ["Independence", "Reflection", "Adaptability"],
  },
  19: {
    summary:
      "A return to Mt. Ulap with unfinished business—an opportunity to approach a familiar challenge with more experience and a stronger mindset.",
    context:
      "Calling this trip a comeback gave the route a different meaning. It was no longer only about discovering Mt. Ulap; it was about measuring growth against an experience I already knew.",
    story: [
      "Returning to a challenge can be harder than facing it for the first time because you remember the difficult sections. At the same time, experience changes how you prepare, pace yourself, and respond when the route becomes demanding.",
      "The second journey made improvement visible. Familiar terrain became proof that setbacks and unfinished goals do not have to remain permanent—they can become useful information for a better attempt.",
    ],
    reflection:
      "Mt. Ulap Part 2 represents iteration: review what happened, return with a better approach, and finish stronger. That cycle is just as important in software development as it is on a mountain.",
    qualities: ["Resilience", "Iteration", "Follow-through"],
  },
  9: {
    summary:
      "A memorable mountain journey in Bakun, where the scale of the landscape rewarded careful preparation, courage, and respect for the trail.",
    context:
      "Mt. Kabunian offered the kind of scenery that makes a person stop and take in the scale of the Cordillera landscape. It was beautiful, demanding, and impossible to rush.",
    story: [
      "The journey asked for attention from beginning to end. Mountain terrain has a way of making every decision practical: conserve energy, watch each step, stay aware of the conditions, and respect the route.",
      "The views made the effort worthwhile, but the lasting memory was the feeling of moving through a place much larger than myself. It turned the hike into both an adventure and a lesson in humility.",
    ],
    reflection:
      "Kabunian reminded me that confidence should be supported by preparation. Ambitious work becomes safer and more achievable when risks are understood and the environment is respected.",
    qualities: ["Courage", "Preparation", "Respect"],
  },
  15: {
    summary:
      "A quiet mountain escape in Kabayan that traded everyday noise for open landscapes, cooler air, and a much-needed sense of perspective.",
    context:
      "Mt. Timbac felt less like a race toward a destination and more like an opportunity to reset. The slower atmosphere made room to notice the landscape and enjoy the journey without forcing it.",
    story: [
      "Some trips are valuable because they are difficult; others matter because they create breathing room. This adventure belonged to the second kind—a pause from routine and a chance to be fully present somewhere different.",
      "The mountain environment made ordinary concerns feel smaller. That distance did not solve every problem, but it made it easier to return with renewed energy and a clearer sense of priority.",
    ],
    reflection:
      "Timbac reminded me that rest supports good work. Sustainable progress requires moments to recover, reflect, and return with better attention.",
    qualities: ["Perspective", "Presence", "Recovery"],
  },
  12: {
    summary:
      "My first Mt. Ulap experience—a journey across open ridgelines that turned curiosity into the beginning of a lasting interest in mountain adventures.",
    context:
      "First experiences carry a useful uncertainty. I knew the destination, but not yet how the route would feel or which moments would become the ones I remembered most.",
    story: [
      "The first Mt. Ulap journey was about discovery. Every section introduced something new, from the rhythm of the trail to the scale of the surrounding ridges and the satisfaction of seeing the route unfold.",
      "Starting without complete familiarity made the experience more meaningful. It proved that readiness does not always mean knowing everything in advance; sometimes it means preparing responsibly and being willing to learn along the way.",
    ],
    reflection:
      "This first Ulap trip represents curiosity in action. Many worthwhile projects begin the same way: with an unfamiliar problem, a willingness to start, and enough persistence to keep learning.",
    qualities: ["Curiosity", "Initiative", "Learning"],
  },
  16: {
    summary:
      "A shared Mt. Yangbew climb with Stephen, proving that even a shorter adventure becomes memorable through good company and a shared goal.",
    context:
      "This journey was defined as much by companionship as by the destination. Moving together made the climb lighter and gave the day its own energy.",
    story: [
      "Hiking with someone changes the experience. Conversation, shared pauses, and small moments of encouragement turn individual progress into something collaborative.",
      "Mt. Yangbew became a reminder that an adventure does not need to be the longest or most difficult to matter. The quality of the experience often comes from the people who share it.",
    ],
    reflection:
      "Yangbew reinforced something I also value in development teams: progress feels better when people communicate, support one another, and celebrate the result together.",
    qualities: ["Collaboration", "Encouragement", "Shared achievement"],
  },
  11: {
    summary:
      "A demanding motorcycle journey to Casiguran that tested endurance, route awareness, and the ability to stay composed through a long day on the road.",
    context:
      "The distance made this ride memorable. Casiguran was not a quick stop; reaching it required sustained attention and respect for the demands of a long route.",
    story: [
      "Long-distance riding makes fatigue part of the plan. Progress depends on managing energy, staying alert, checking the route, and knowing when a pause is more valuable than pushing forward.",
      "The difficult parts gave the destination its meaning. By the end, the strongest impression was a mix of exhaustion and satisfaction—the feeling that comes from completing something that demanded patience all the way through.",
    ],
    reflection:
      "Casiguran reminded me that endurance is not simply continuing without stopping. It is managing resources well enough to complete the journey safely and responsibly.",
    qualities: ["Endurance", "Planning", "Composure"],
  },
  17: {
    summary:
      "A brief Sagada coffee stop made unforgettable by an 85-year-old grandfather whose energy turned a short visit into a lesson about staying adventurous.",
    context:
      "The plan was simple: stop, have coffee, and continue. What stayed with me was meeting an 85-year-old grandfather who could still take on the climb as a passenger on the Aerox.",
    story: [
      "Not every meaningful travel story comes from a long itinerary. Sometimes one person changes the character of an entire day. Lolo's energy made age feel less like a limit and more like a reminder to keep participating in life.",
      "The visit lasted only around an hour, but the memory lasted much longer. It showed how a quick stop can become the most important part of a journey when I remain open to the people around me.",
    ],
    reflection:
      "Sagada reminded me to stay curious and never assume that experience reduces a person's appetite for adventure. Growth can continue at every stage of life.",
    qualities: ["Curiosity", "Humility", "Inspiration"],
  },
  18: {
    summary:
      "A motorcycle ride to Atok and Northern Blossom, where mountain roads, cool air, and carefully maintained scenery rewarded a slower pace.",
    context:
      "Northern Blossom offered a different kind of destination: organized, colorful, and best experienced by slowing down enough to notice the details.",
    story: [
      "The route to Atok was part of the experience, but arriving changed the pace of the day. Instead of moving toward the next checkpoint, the goal became simply observing the landscape and appreciating the work behind it.",
      "That contrast made the trip memorable. A long ride can sharpen the sense of arrival, while a quiet destination can make the effort feel balanced rather than rushed.",
    ],
    reflection:
      "Atok reminded me that details shape the whole experience. Whether in a garden, an interface, or a software workflow, thoughtful small decisions are what make something feel complete.",
    qualities: ["Attention to detail", "Patience", "Appreciation"],
  },
  10: {
    summary:
      "A motorcycle ride to Dingalan that turned an ordinary departure into a day of coastal scenery, mountain roads, and purposeful exploration.",
    context:
      "Dingalan was a reason to get on the road and see what waited beyond the familiar route. The journey combined movement, changing scenery, and the freedom of choosing to explore.",
    story: [
      "This ride was built around a straightforward idea: prepare, leave, and experience the destination directly. That simplicity made the day feel open and gave each part of the route room to stand out.",
      "The best part of a ride is often the transition between places. Watching the surroundings change creates a clear sense of progress and makes the destination feel earned rather than consumed.",
    ],
    reflection:
      "Dingalan reminded me that initiative creates opportunities. Plans become experiences only after the first real step is taken.",
    qualities: ["Initiative", "Readiness", "Exploration"],
  },
};

function visibleText(value?: string | null) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getBlogEditorialContent(post?: BlogPost | null) {
  if (!post) return null;

  return editorialById[post.id] || null;
}

export function getPreferredBlogDescription(post: BlogPost) {
  const originalDescription = visibleText(post.description);
  const editorial = getBlogEditorialContent(post);

  if (originalDescription.length >= 70 || !editorial) {
    return originalDescription;
  }

  return editorial.summary;
}

export function shouldUseEditorialBody(body?: string | null) {
  return visibleText(body).length < 120;
}
