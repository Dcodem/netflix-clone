/** Mock catalog of recognizable titles with TMDB poster and backdrop art. */

const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
]

const CAST = [
  'Alex Rivera',
  'Sam Chen',
  'Jordan Hale',
  'Riley Okonkwo',
  'Morgan Ellis',
  'Quinn Park',
  'Taylor Nguyen',
  'Casey Brooks',
  'Avery Shah',
  'Jamie Cole',
  'Drew Patel',
  'Harper Diaz',
  'Rowan Kim',
  'Eden Walsh',
  'Sasha Brooks',
  'Noah Grant',
  'Lena Ortiz',
  'Miles Brennan',
  'Ivy Nakamura',
  'Owen Clarke',
]

const ADJECTIVES = [
  'Silent',
  'Iron',
  'Hidden',
  'Golden',
  'Broken',
  'Quiet',
  'Wild',
  'Pale',
  'Last',
  'First',
  'Night',
  'Paper',
  'Glass',
  'River',
  'Winter',
  'Summer',
  'Hollow',
  'Bright',
  'Faded',
  'Deep',
  'Lost',
  'Open',
  'Cold',
  'Burning',
  'Silver',
  'North',
  'Red',
  'Blue',
  'Empty',
  'Second',
]

const NOUNS = [
  'Harbor',
  'Crown',
  'Signal',
  'Garden',
  'Protocol',
  'Machine',
  'Mirror',
  'Empire',
  'Witness',
  'Season',
  'Court',
  'Pact',
  'Orbit',
  'Radio',
  'Hours',
  'Crew',
  'Moons',
  'Line',
  'Sky',
  'City',
  'Road',
  'House',
  'Lights',
  'Room',
  'Shift',
  'Table',
  'South',
  'Legacy',
  'Files',
  'Frontier',
]

const EPISODE_TITLES = [
  'Pilot',
  'The Offer',
  'Aftermath',
  'Crossroads',
  'Smoke',
  'The Map',
  'False Flag',
  'Inheritance',
  'Night Work',
  'The Guest',
  'Split Decision',
  'Return Trip',
  'Cold Open',
  'Second Name',
  'The Leak',
  'Last Train',
  'Black Ice',
  'No Witnesses',
  'The Long Way Home',
  'House Rules',
  'What We Owe',
  'Red Hour',
  'A Clean Exit',
  'The Quiet Room',
]

const EPISODE_BEATS = [
  'A small mistake in public turns into a problem nobody can ignore.',
  'An old ally shows up with a deal that sounds too clean.',
  'The investigation points at someone inside the house.',
  'A quiet night run uncovers a second set of books.',
  'Everyone agrees to tell the truth. Almost everyone does.',
  'A buried recording rewrites the last three weeks.',
  'The team splits after a vote that should have been easy.',
  'Someone from the first season walks back in without warning.',
  'A family dinner becomes the least safe room in the city.',
  'The plan works, then the bill arrives.',
  'Two versions of the same night cannot both be real.',
  'A witness changes their story after a five-minute phone call.',
  'A favor called in at dawn costs more than anyone budgeted.',
  'The safest room on the map has a new lock — and a new owner.',
  'A coded message arrives with a name nobody wanted to hear.',
  'Loyalty is tested in a hallway with no cameras and one exit.',
]

const EPISODE_BEATS_BY_GENRE = {
  Action: [
    'A chase that should have lasted three blocks becomes a city-wide problem.',
    'The extraction goes clean until the getaway driver vanishes.',
    'One bad shot turns a quiet job into an all-night siege.',
    'Backup is promised. Backup is late. The clock is not.',
  ],
  Adventure: [
    'A map with a missing fold sends everyone the wrong way on purpose.',
    'The shortcut through the hills is older than the people using it.',
    'A storm closes the only pass, and the prize is still moving.',
    'What they find is not treasure. It is a reason to keep going.',
  ],
  Animation: [
    'A tiny lie about a missing toy becomes a neighborhood-wide rescue.',
    'The new kid in class has a secret that does not fit in a backpack.',
    'A race to the festival starts with the wrong shoes and the right friends.',
    'Home is one street over, and somehow still a whole world away.',
    'A cardboard fort is declared a sovereign nation before lunch.',
    'The last biscuit starts a negotiation that lasts all afternoon.',
    'A backyard game needs a referee. The dog volunteers.',
    'Someone draws a map of the house and forgets the most important room.',
    'A rainy-day plan escapes the living room and takes the street with it.',
    'The fancy outfit survives everything except the puddle by the gate.',
    'A bedtime story gets rewritten by the people who are supposed to be asleep.',
    'The keep-away game works until the keep-away object has opinions.',
    'A borrowed cape turns a regular walk into a parade of two.',
    'The treasure was under the couch the whole time. Getting it out is the plot.',
  ],
  Comedy: [
    'A well-meant plan collapses in front of the one person who cannot laugh yet.',
    'The office party needs a hero. It gets a volunteer with a spreadsheet.',
    'A white lie about dinner reservations snowballs into a citywide rumor.',
    'Everyone agrees to play it cool. Nobody does.',
  ],
  Crime: [
    'A body in the wrong zip code ties two crews that were never supposed to meet.',
    'The alibi is perfect except for the timestamp on a parking photo.',
    'A bag of cash shows up with a note that is not a joke.',
    'The informant wants out. The city is not finished with them.',
  ],
  Documentary: [
    'A forgotten tape from the archive contradicts the official timeline.',
    'The interview that was supposed to close the film reopens the case.',
    'A source changes their name, then changes their story.',
    'What the cameras were not allowed to film is the whole point.',
  ],
  Drama: [
    'A conversation that should have happened years ago finally has nowhere to hide.',
    'Someone comes home early and sees the version of the family that exists after dark.',
    'A promotion, a funeral, and a secret share the same afternoon.',
    'The apology is ready. The person who needs it is not.',
  ],
  Family: [
    'A lost pet and a stubborn sibling turn a Saturday into an odyssey.',
    'The school play needs a lead. The understudy has other plans.',
    'A promise made at breakfast has to survive the long way home.',
    'Everyone wants to be the hero. The dog already is.',
    'The science fair volcano was supposed to be a model. It is not.',
    'A sleepover rulebook is written, signed, and immediately ignored.',
    'The long way home includes a detour that nobody will admit to planning.',
    'Someone has to return the library book. The book has other ideas.',
    'A family photo needs everyone looking at the same camera at the same time.',
    'The leftover cake is missing. The investigation is not subtle.',
    'A weekend chore chart becomes a heist movie with snacks.',
    'The guest room is ready. The guest is a raccoon with confidence.',
  ],
  Fantasy: [
    'A door that was painted shut opens for the one person who was told not to knock.',
    'The old rule about names turns out to be a warning, not a superstition.',
    'A borrowed charm works once. The second time has a price.',
    'The map of the other world was drawn by someone who never came back.',
  ],
  History: [
    'A letter from the capital arrives with two seals and one impossible order.',
    'The night before the vote, a private dinner rewrites the public story.',
    'An heirloom is opened and the family name looks different in the light.',
    'The official record skips an hour. That hour is the episode.',
  ],
  Horror: [
    'The house is quiet in a way that means it is listening.',
    'A rule posted on the fridge is older than the people who live there.',
    'Something in the walls keeps the same hours as the family.',
    'They board up the wrong window. The right one was never a window.',
  ],
  Mystery: [
    'A clue hidden in a grocery list points at the last person anyone suspected.',
    'The locked room has two keys and three versions of the night.',
    'A missing minute on the security tape is doing more work than the rest of the hour.',
    'The detective’s favorite witness remembers a color that was not there.',
  ],
  Romance: [
    'A missed train puts two people in the same delayed night for the first time.',
    'The text that was never sent gets read anyway.',
    'A wedding toast goes off-script and tells the truth by accident.',
    'They agree to keep it casual. The city does not cooperate.',
  ],
  'Sci-Fi': [
    'A routine systems check returns a date that has not happened yet.',
    'The replica is polite, helpful, and missing one childhood memory.',
    'A signal from the dark side of the schedule should not exist.',
    'They shut the experiment down. It keeps answering.',
  ],
  Thriller: [
    'The safe word is used. Nobody on the other end recognizes it.',
    'A tracking app shows a phone in two places at once.',
    'The getaway is clean until a familiar song plays in the next car.',
    'Someone has been in the apartment. They folded the towels better.',
  ],
  War: [
    'A ceasefire holds long enough for a letter to arrive with the wrong name.',
    'The supply drop lands in a field that is no longer theirs.',
    'Orders change at dawn. The people carrying them do not get the update.',
    'A radio goes quiet, then comes back speaking in a friend’s voice.',
  ],
}

const SYNOPSIS_BY_TITLE = {
  Inception:
    'A crew that steals secrets from sleeping minds is hired to plant one instead. Every layer down, the job looks more like a confession.',
  'The Dark Knight':
    'A masked vigilante tries to keep a city honest while a smiling anarchist proves that rules are just costumes. Every rescue paints a bigger target.',
  Interstellar:
    'A pilot leaves a dying farm belt for a wormhole that may not send anyone home. Love becomes the only instrument that still reads true.',
  'Dune: Part Two':
    'A hunted heir walks into a desert that already has a prophecy ready. Sand, spice, and revenge argue over who gets to name the future.',
  'Top Gun: Maverick':
    'An aging flyer is asked to teach a suicide run to pilots who remind him of the friend he could not save. The sky is still the easy part.',
  'Spider-Man: No Way Home':
    'A kid in a mask asks for his secret back and tears a hole between lives he was never meant to meet. Saving everyone means choosing who stays.',
  'Everything Everywhere All at Once':
    'A laundromat owner is drafted into a war across every version of herself. The multiverse is loud. The laundry is due.',
  Oppenheimer:
    'A physicist builds a sun in the desert and spends the rest of his life arguing with the shadow it casts. Genius is not the same as permission.',
  Wicked:
    'Two students at a glittering school learn that green skin and perfect smiles are both costumes. Friendship is the spell nobody scheduled.',
  Superman:
    'A kind stranger from the stars tries to be useful on a planet that is not sure it wants a hero. Hope is treated like a threat.',
  'The Matrix':
    'A hacker is offered the kind of truth that does not let you clock back in. Reality was a job. Waking up is the revolt.',
  Parasite:
    'A hungry family folds itself into a rich household one polite lie at a time. The basement was always part of the floor plan.',
  Whiplash:
    'A young drummer hunts a teacher who only praises through pain. Talent is not the question. Survival of the tempo is.',
  'Mad Max: Fury Road':
    'A silent driver and a fugitive warrior punch a war rig through the desert toward a green place that may be a rumor. Gasoline is the plot.',
  'Get Out':
    'A weekend with the parents is sold as progress and runs like a hunt. The sunken place has excellent manners.',
  'La La Land':
    'A pianist and an actress bet their best years on a city that eats ambition for breakfast. The duet is gorgeous. The timing is not.',
  'The Grand Budapest Hotel':
    'A dandy concierge and his lobby boy smuggle a fortune through a crumbling Europe. Courtesy is a martial art.',
  'Spirited Away':
    'A sulking kid follows her parents into a bathhouse where names are currency and work is the only way home. Wonder has a time clock.',
  Coco:
    'A boy chasing a forbidden guitar crosses into a glowing afterlife that runs on memory. Music is the visa. Family is the border.',
  'The Social Network':
    'A dorm-room slight becomes a machine that maps everyone. Friendship is the first user agreement to break.',
  'Blade Runner 2049':
    'A quiet blade runner is sent to bury a secret that would rewrite who counts as alive. The rain does not care about the paperwork.',
  'John Wick':
    'A retired hitman is pulled back in over a puppy, a car, and a city of assassins with rules. Grief learns gold coin etiquette.',
  Barbie:
    'A perfect doll leaves the pink dreamhouse and finds that the real world has worse lighting and better questions. The smile is a plot point.',
  Arrival:
    'A linguist is hired to talk to visitors whose language rearranges time. The message is not a weapon until someone decides it is.',
  'The Batman':
    'A young vigilante follows a Riddler’s trail through a city that rewards the worst people. The cape is new. The rot is not.',
  'Knives Out':
    'A famous detective arrives at a mansion where everyone had a motive and a better alibi. The will is a weapon. So is the nurse.',
  'Paddington 2':
    'A polite bear with a marmalade habit tries to buy a gift and walks into a frame-up. Kindness turns out to be tactical.',
  Moonlight:
    'A quiet kid in Miami grows into three versions of himself, each one still looking for a safe place to say his name.',
  'Spider-Man: Brand New Day':
    'A neighborhood hero tries to start over without the old secrets, then learns the city does not do clean slates. The mask still fits.',
  'The Odyssey':
    'A long way home is longer when the sea keeps changing the rules. Gods, monsters, and memory all want a cut of the return.',
  Mutiny:
    'A crew turns on its captain in waters where the law is whatever still floats. Loyalty lasts until the next order.',
  'Rage of Stars':
    'A burnt-out pilot is sent to silence a signal that should not exist. Space is empty. The rage is not.',
  'Facing El Chapo':
    'A pursuit across borders treats a legend like a man who still has to eat. The myth is good cover. The trail is better.',
  'Toy Story 5':
    'The nursery changes again, and the toys have to decide what loyalty looks like when the kid is almost grown.',
  Obsession:
    'A crush that will not take a hint learns the locks, the schedule, and the story you tell yourself at 3 a.m.',
  Moana:
    'A wayfinder reads the ocean like a relative and sails toward a trouble that will not stay on the horizon.',
  'Minions & Monsters':
    'Tiny henchmen clock in for the wrong villain and accidentally adopt a monster who needs management. Chaos is the benefit.',
  Colony:
    'A settlement sold as a fresh start is already spoken for. The welcome kit does not mention the thing in the vents.',
  'Hotel Desire':
    'One night in a hotel that pretends not to keep records. Desire is easy. Leaving in the morning is the plot.',
  'Evil Dead Burn':
    'A cabin, a book, and a night that refuses to stay dead. The woods have heard this one before and still want a sequel.',
  'Mourning Wife':
    'A widow keeps the house exactly as it was and learns grief can be a roommate with opinions.',
  'The Death of Robin Hood':
    'The outlaw comes home to a forest that has new landlords. Legend is a moving target. So is he.',
  Backrooms:
    'Endless beige rooms, a hum in the lights, and a door that only opens behind you. Getting lost is the business model.',
  'Pinocchio: Unstrung':
    'A wooden boy wants to be real in a town that prefers puppets. The strings were the kind part.',
  'Disclosure Day':
    'The government picks a date to tell the truth about the sky. The briefing leaks. The visitors were already listening.',
  'Rosebush Pruning':
    'A careful gardener, a perfect hedge, and a neighborhood that prunes more than plants. Manners with a blade.',
  'The Last House':
    'The final address on a dead-end street still has the lights on. Whatever lives there has been waiting for company.',
  'Greenland 2: Migration':
    'The comet was only the opening act. A family joins a moving column of people hunting the last safe latitude.',
  'Project Hail Mary':
    'A lone astronaut wakes with a science problem that will eat the sun if he gets the homework wrong. The universe sent a lab partner.',
  'The End of Oak Street':
    'A quiet block starts forgetting its own house numbers. The cul-de-sac is a seam. Something is pulling the thread.',
  'Shape of My Heart':
    'Two people keep almost saying it, then choosing the safer sentence. The shape is obvious. The timing is the dare.',
  'Scary Movie':
    'Every slasher rule gets a pie in the face and still somehow kills the intern. Scream, then rewind for the gag you missed.',
  'Stranger Things':
    'A missing kid, a secret lab, and a girl with a buzz cut pull a small town into a world that was never supposed to leak.',
  'The Last of Us':
    'A smuggler and a girl walk a ruined country that still has opinions about who gets to be human. Infection is only one of the hungers.',
  'The Mandalorian':
    'A bounty hunter with a creed and a very small passenger keeps choosing the job that pays in trouble. Armor is easier than parenting.',
  'The Bear':
    'A fine-dining chef inherits a neighborhood sandwich shop and a family that plates grief with the Italian beef.',
  Severance:
    'Office workers split their memories at the elevator and call it balance. The other you has a desk, a smile, and no way home.',
  Shogun:
    'An English sailor washes into a war for a throne that does not know his name. Translation is survival. So is patience.',
  'The Crown':
    'A family that is also a country learns that duty photographs better than love. The palace has excellent acoustics for secrets.',
  'Ted Lasso':
    'An American football coach is hired to fail at soccer and refuses to. Kindness is the tactic nobody budgeted for.',
  'The Boys':
    'Corporate superheroes sell hope and deliver collateral damage. A bitter nobody and a disillusioned speedster start keeping receipts.',
  Wednesday:
    'A deadpan outcast at a school for outcasts treats murder like extra credit. The cello is not a personality. It is a warning.',
  'The Witcher':
    'A mutant swordsman takes monster contracts and keeps getting drafted into royal messes. Destiny is a pest with good timing.',
  'Slow Horses':
    'Britain’s worst spies are parked in a slum office until a real crisis needs people nobody will miss. Incompetence is camouflage.',
  'Only Murders in the Building':
    'Three neighbors launch a true-crime podcast about a death in their building and immediately become suspects. The acoustics are excellent.',
  Bluey:
    'A blue heeler family turns backyard games into tiny epics. The jokes are for the kids. The gut-punch is for whoever is making dinner.',
  'Avatar: The Last Airbender':
    'A kid who can bend the elements has to grow up fast enough to stop a war. Friends, flying bison, and a world that is already tired.',
  'The Office':
    'A paper company pretends the cameras are not there. They are. So is the world’s most committed regional manager.',
  Reacher:
    'A drifting investigator the size of a doorway walks into small towns and leaves them less crooked. Coffee, justice, next bus.',
  'The Mentalist':
    'A fake psychic with a real eye for tells helps a bureau catch killers while hunting the one who made it personal.',
  Lioness:
    'A CIA program drops ordinary-looking women into rooms where the truth is armed. The cover story has to survive the marriage too.',
  'Outer Banks':
    'Sunburnt teens chase a legend, a father, and a fortune while the island’s rich kids treat the law like a beach club.',
  Lanterns:
    'A pair of investigators follows a light that should not be on the map. The case is local. The physics are not.',
  'Paradise Hotel':
    'Strangers are locked in a glossy resort and asked to date, scheme, and pretend the cameras are a lifestyle.',
  Tagesschau:
    'The day’s events, delivered with the calm of a country that still believes in a nightly roundup.',
  Silo:
    'Thousands live stacked in a buried cylinder and are told the outside will kill them. Curiosity is a capital offense.',
  'Law & Order: Special Victims Unit':
    'Detectives take the cases nobody wants to describe at dinner. The system is slow. The squad is not done.',
  'Gran hermano':
    'Houseguests, cameras, and a public vote turn ordinary people into a weekly argument. Privacy was the first eviction.',
  'Family Guy':
    'A Rhode Island family keeps interrupting its own plot for a cutaway that should not work and somehow does.',
  'The Rookie':
    'The oldest newbie in the department learns patrol, paperwork, and how fast a quiet street can change its mind.',
  "Grey's Anatomy":
    'Surgeons fall in love, fall apart, and still have to scrub in. The hospital is the third character in every fight.',
  'The Simpsons':
    'Springfield stays exactly itself while a yellow family finds a new way to love, fail, and reopen the same doughnut box.',
  'Watch What Happens Live with Andy Cohen':
    'A late-night living room where the stories from the other shows come to gossip in person.',
  'The Tonight Show Starring Jimmy Fallon':
    'A desk, a house band, and a host who will play the game if you will. Celebrities clock in for bits and a song.',
  'House of the Dragon':
    'A dynasty with dragons treats succession like a blood sport. The iron is the easy part. The family is the fire.',
  NCIS:
    'Navy cops with a gut instinct and a lab that never sleeps take cases that start on a ship and end in a family secret.',
  Supernatural:
    'Two brothers drive a black car toward whatever is eating the town this week. The real haunt is the mileage.',
  'Criminal Minds':
    'Profilers fly to the worst living rooms in America and try to think like the person who got there first.',
}

export const PAGE_SIZE = 24

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function titleAt(index) {
  const adjective = ADJECTIVES[index % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(index / ADJECTIVES.length) % NOUNS.length]
  return `${adjective} ${noun}`
}

function genresFor(index) {
  const primary = GENRES[index % GENRES.length]
  const secondary = GENRES[(index * 5 + 3) % GENRES.length]
  const tertiary = GENRES[(index * 7 + 1) % GENRES.length]
  const list = [primary]
  if (secondary !== primary) list.push(secondary)
  if (index % 4 === 0 && tertiary !== primary && tertiary !== secondary) list.push(tertiary)
  return list
}

function ratingFor(index) {
  return Number((5.6 + ((index * 17) % 39) / 10).toFixed(1))
}

function yearFor(index) {
  return 2015 + (index % 12)
}

function qualityFor(index) {
  return ['FHD', '4K', '1080p', 'FHD'][index % 4]
}

function castFor(index) {
  const start = index % CAST.length
  return [0, 1, 2, 3].map((offset) => CAST[(start + offset) % CAST.length])
}

function creatorsFor(index) {
  const start = (index + 7) % CAST.length
  return [0, 1].map((offset) => CAST[(start + offset) % CAST.length])
}

function directorFor(index) {
  return CAST[(index + 11) % CAST.length]
}

function writersFor(index) {
  const start = (index + 3) % CAST.length
  return [0, 1].map((offset) => CAST[(start + offset) % CAST.length])
}

function hashString(value) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const GENRE_LOGS = {
  Action: [
    'When the last clean option burns, the only way out is through the people who built the trap.',
    'A specialist is hired for one last run and spends it rewriting the rules of the job.',
    'The mission is simple until the target turns out to be someone they already failed.',
  ],
  Adventure: [
    'A map, a dare, and a horizon that keeps moving the prize one valley farther.',
    'The journey was sold as a shortcut. The land has older plans.',
    'They leave home for a legend and come back carrying a different name.',
  ],
  Animation: [
    'A small hero with a large problem learns that brave and loud are not the same skill.',
    'Friendship, a slightly cursed object, and a race to get home before dinner.',
    'The world is bigger than the backyard, and the backyard was never that small.',
  ],
  Comedy: [
    'A decent plan meets the one person who cannot let it stay decent.',
    'Everyone is pretending this is fine. The laugh track is optional. The mess is not.',
    'Ambition, timing, and a joke that lands on the wrong night.',
  ],
  Crime: [
    'A job that was supposed to stay local acquires a body and a witness with better timing.',
    'Loyalty is the product. Betrayal is the overhead.',
    'The crew had rules. The city had more.',
  ],
  Documentary: [
    'The official story is tidy. The footage is not.',
    'A camera follows the people who were told they were not the point.',
    'What gets left on the archive floor is the plot.',
  ],
  Drama: [
    'A family, a secret, and the afternoon that finally runs out of polite rooms.',
    'Love is still on the table. So is the thing nobody will name.',
    'The right choice arrives late and asks to stay.',
  ],
  Family: [
    'A household learns that the smallest promise can still need a rescue.',
    'Kids, grown-ups, and a problem that will not wait until after school.',
    'Home is the mission. The adventure is how they get back to it.',
  ],
  Fantasy: [
    'A door opens for the person who was told not to knock. The other side has terms.',
    'Magic is real, expensive, and allergic to shortcuts.',
    'A borrowed gift comes with a name the old world still answers.',
  ],
  History: [
    'A private hour rewrites a public century.',
    'Power photographs well. The people holding it do not always.',
    'The record skips a page. That page is the whole story.',
  ],
  Horror: [
    'The house is empty in a way that means it is full.',
    'A rule on the fridge is older than the family and hungrier.',
    'They came for a weekend. The dark came with a lease.',
  ],
  Mystery: [
    'A locked room, two timelines, and a clue that looks like an errand.',
    'Everyone has an alibi. One of them is a story.',
    'The missing piece was in the photograph the whole time.',
  ],
  Romance: [
    'Two people keep choosing the safer sentence. The city does not cooperate.',
    'Timing is the antagonist. Chemistry refuses to read the schedule.',
    'A chance meeting with a sequel nobody planned to write.',
  ],
  'Sci-Fi': [
    'A system returns an answer from a day that has not happened yet.',
    'The future arrived early and did not bring instructions.',
    'They built a tool to save the world. It has opinions.',
  ],
  Thriller: [
    'The safe word is used. The other end of the line has a new voice.',
    'A perfect getaway leaves one fingerprint in the wrong decade.',
    'Someone has been in the room. They were careful. Not careful enough.',
  ],
  War: [
    'Orders change at dawn. The people carrying them do not get the update.',
    'A ceasefire long enough to hear what the quiet is hiding.',
    'The front moves. The letters home do not.',
  ],
}

function synopsisFor(item) {
  const named = SYNOPSIS_BY_TITLE[item.title]
  if (named) return named
  const genre = item.genres[0] ?? 'Drama'
  const pool = GENRE_LOGS[genre] ?? GENRE_LOGS.Drama
  return pool[hashString(item.id) % pool.length]
}

function episodeTitleFor(item, seasonNumber, number) {
  const start = hashString(`${item.id}:${seasonNumber}`) % EPISODE_TITLES.length
  return EPISODE_TITLES[(start + number - 1) % EPISODE_TITLES.length]
}

function episodeSynopsisFor(item, seasonNumber, number) {
  const genre = item.genres[0] ?? 'Drama'
  const genrePool = EPISODE_BEATS_BY_GENRE[genre] ?? []
  const kid = genre === 'Animation' || genre === 'Family'
  const extra = kid ? [] : EPISODE_BEATS
  const pool = [...genrePool, ...extra]
  const start = hashString(`${item.id}:s${seasonNumber}`) % pool.length
  return pool[(start + number - 1) % pool.length]
}

function makeItem(index, kind) {
  const title = titleAt(index)
  const year = yearFor(index)
  const prefix = kind === 'show' ? 8000 + index : 3000 + index
  const id = `${prefix}-${slugify(title)}-${year}`
  return {
    id,
    title,
    kind,
    year,
    rating: ratingFor(index),
    quality: qualityFor(index),
    genres: genresFor(index),
    poster_url: `/art/poster/${id}?v=2`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

function namedItem(kind, n, title, year, rating, genres, poster, backdrop) {
  const prefix = kind === 'show' ? 9100 + n : 2100 + n
  const id = `${prefix}-${slugify(title)}-${year}`
  return {
    id,
    title,
    kind,
    year,
    rating,
    quality: '4K',
    genres,
    poster_url: poster || `/art/poster/${id}?v=2`,
    backdrop_url: backdrop || `/art/backdrop/${id}?v=2`,
    href: `/${kind === 'show' ? 'shows' : 'movies'}/view/${id}`,
  }
}

const REAL_MOVIES = [
  namedItem('movie', 1, "Inception", 2010, 8.8, ["Sci-Fi","Action","Thriller"], "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"),
  namedItem('movie', 2, "The Dark Knight", 2008, 9, ["Action","Crime","Drama"], "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "https://image.tmdb.org/t/p/w1280/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg"),
  namedItem('movie', 3, "Interstellar", 2014, 8.7, ["Sci-Fi","Drama","Adventure"], "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg", "https://image.tmdb.org/t/p/w1280/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg"),
  namedItem('movie', 4, "Dune: Part Two", 2024, 8.5, ["Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg", "https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg"),
  namedItem('movie', 5, "Top Gun: Maverick", 2022, 8.3, ["Action","Drama"], "https://image.tmdb.org/t/p/w500/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg", "https://image.tmdb.org/t/p/w1280/AaV1YIdWKnjAIAOe8UUKBFm327v.jpg"),
  namedItem('movie', 6, "Spider-Man: No Way Home", 2021, 8.2, ["Action","Adventure","Fantasy"], "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", "https://image.tmdb.org/t/p/w1280/uyrOU4BDm2kbVxFsMiDFIHDhc4d.jpg"),
  namedItem('movie', 7, "Everything Everywhere All at Once", 2022, 7.8, ["Comedy","Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", "https://image.tmdb.org/t/p/w1280/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg"),
  namedItem('movie', 8, "Oppenheimer", 2023, 8.3, ["Drama","History"], "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", "https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg"),
  namedItem('movie', 9, "Wicked", 2024, 7.5, ["Fantasy","Family","Adventure"], "https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg", "https://image.tmdb.org/t/p/w1280/fyZ6SDUS4o9jp2EHxfZa3qS9ean.jpg"),
  namedItem('movie', 10, "Superman", 2025, 7.2, ["Action","Adventure","Sci-Fi"], "https://image.tmdb.org/t/p/w500/ldyfo0BKmz5rWtJJKCvwaNS4cJT.jpg", "https://image.tmdb.org/t/p/w1280/eGX66zonvc4bXg3rM08RUxdYSDx.jpg"),
  namedItem('movie', 11, "The Matrix", 1999, 8.7, ["Sci-Fi","Action"], "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg", "https://image.tmdb.org/t/p/w1280/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg"),
  namedItem('movie', 12, "Parasite", 2019, 8.5, ["Thriller","Drama"], "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", "https://image.tmdb.org/t/p/w1280/vbC0rzdrb7Ohc2TkbEbxtOABECe.jpg"),
  namedItem('movie', 13, "Whiplash", 2014, 8.5, ["Drama"], "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg", "https://image.tmdb.org/t/p/w1280/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg"),
  namedItem('movie', 14, "Mad Max: Fury Road", 2015, 8.1, ["Action","Adventure"], "https://image.tmdb.org/t/p/w500/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg", "https://image.tmdb.org/t/p/w1280/uT895WNwm0aIJRtGizcQhrejWUo.jpg"),
  namedItem('movie', 15, "Get Out", 2017, 7.8, ["Horror","Thriller"], "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg", "https://image.tmdb.org/t/p/w1280/bBQHALHRAaaORlPNXv7fNcRXYdx.jpg"),
  namedItem('movie', 16, "La La Land", 2016, 8, ["Romance","Comedy","Drama"], "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg", "https://image.tmdb.org/t/p/w1280/nlPCdZlHtRNcF6C9hzUH4ebmV1w.jpg"),
  namedItem('movie', 17, "The Grand Budapest Hotel", 2014, 8.1, ["Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg", "https://image.tmdb.org/t/p/w1280/9udCLTxTFl28RxnK8Q05E154ZGa.jpg"),
  namedItem('movie', 18, "Spirited Away", 2001, 8.6, ["Animation","Family","Fantasy"], "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", "https://image.tmdb.org/t/p/w1280/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg"),
  namedItem('movie', 19, "Coco", 2017, 8.4, ["Animation","Family","Adventure"], "https://image.tmdb.org/t/p/w500/6Ryitt95xrO8KXuqRGm1fUuNwqF.jpg", "https://image.tmdb.org/t/p/w1280/g7CHF8gTLGooTbP4GznIGwaqAGL.jpg"),
  namedItem('movie', 20, "The Social Network", 2010, 7.8, ["Drama"], "https://image.tmdb.org/t/p/w500/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg", "https://image.tmdb.org/t/p/w1280/1PXwh3nJzgRkkYnqfWInJNypeL4.jpg"),
  namedItem('movie', 21, "Blade Runner 2049", 2017, 8, ["Sci-Fi","Drama"], "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", "https://image.tmdb.org/t/p/w1280/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg"),
  namedItem('movie', 22, "John Wick", 2014, 7.4, ["Action","Thriller"], "https://image.tmdb.org/t/p/w500/wXqWR7dHncNRbxoEGybEy7QTe9h.jpg", "https://image.tmdb.org/t/p/w1280/ff2ti5DkA9UYLzyqhQfI2kZqEuh.jpg"),
  namedItem('movie', 23, "Barbie", 2023, 6.9, ["Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", "https://image.tmdb.org/t/p/w1280/1esAE8sLJRWWFsLLeh5r3g2WanI.jpg"),
  namedItem('movie', 24, "Arrival", 2016, 7.9, ["Sci-Fi","Drama"], "https://image.tmdb.org/t/p/w500/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg", "https://image.tmdb.org/t/p/w1280/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg"),
  namedItem('movie', 25, "The Batman", 2022, 7.8, ["Action","Crime"], "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg", "https://image.tmdb.org/t/p/w1280/rvtdN5XkWAfGX6xDuPL6yYS2seK.jpg"),
  namedItem('movie', 26, "Knives Out", 2019, 7.9, ["Mystery","Comedy","Crime"], "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg", "https://image.tmdb.org/t/p/w1280/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg"),
  namedItem('movie', 27, "Paddington 2", 2017, 7.8, ["Family","Comedy","Adventure"], "https://image.tmdb.org/t/p/w500/1OJ9vkD5xPt3skC6KguyXAgagRZ.jpg", "https://image.tmdb.org/t/p/w1280/kRVUMsXFzhuXjr20JcCGc6TapxA.jpg"),
  namedItem('movie', 28, "Moonlight", 2016, 7.4, ["Drama"], "https://image.tmdb.org/t/p/w500/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg", "https://image.tmdb.org/t/p/w1280/jm1oD3eB08LImSwL1LrzF9AJQ5b.jpg"),
  namedItem('movie', 29, "Spider-Man: Brand New Day", 2026, 7.9, ["Sci-Fi","Action","Adventure"], "https://image.tmdb.org/t/p/w500/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg", "https://image.tmdb.org/t/p/w1280/7iwUUcKURMT7aKfCwMy6YnGtchD.jpg"),
  namedItem('movie', 30, "The Odyssey", 2026, 8, ["Adventure","Action","Fantasy"], "https://image.tmdb.org/t/p/w500/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg", "https://image.tmdb.org/t/p/w1280/RMXG8myu1aGlNUsRjtxzmpdMK0.jpg"),
  namedItem('movie', 31, "Mutiny", 2026, 6.5, ["Action","Thriller"], "https://image.tmdb.org/t/p/w500/aAnTt6KpmbbHbd6xH3FQFlppZjc.jpg", "https://image.tmdb.org/t/p/w1280/qDa0fqDqIBCovRp975RvtGPcuN3.jpg"),
  namedItem('movie', 32, "Rage of Stars", 2026, 5.6, ["Action","Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/oLld47ZT1I3iecM3OWhIphohQUJ.jpg", "https://image.tmdb.org/t/p/w1280/z7lZgL5tzefTfhyRtouThFhsuUS.jpg"),
  namedItem('movie', 33, "Facing El Chapo", 2026, 8.5, ["Crime","Action","Thriller"], "https://image.tmdb.org/t/p/w500/alpf5v4UqSFawPmG9RX03Or4BDk.jpg", "https://image.tmdb.org/t/p/w1280/c4U96GrPRfnNrS01mBtqnocvlLJ.jpg"),
  namedItem('movie', 34, "Toy Story 5", 2026, 8.2, ["Animation","Family","Comedy"], "https://image.tmdb.org/t/p/w500/sfQtVlIHljToOwYjhe21KPGzZWK.jpg", "https://image.tmdb.org/t/p/w1280/8sSKdEmlmqF4kJUd28SqthXC4yZ.jpg"),
  namedItem('movie', 35, "Obsession", 2026, 8.2, ["Horror","Thriller"], "https://image.tmdb.org/t/p/w500/bRwnj8WEKBCvmfeUNOukJPwB43K.jpg", "https://image.tmdb.org/t/p/w1280/rZfmzpixLKLR3Hg2u0WgC7XLFl8.jpg"),
  namedItem('movie', 36, "Moana", 2026, 6.1, ["Family","Fantasy","Comedy"], "https://image.tmdb.org/t/p/w500/zKVgiv5qHCvCLT4A2ymJi5QeXDH.jpg", "https://image.tmdb.org/t/p/w1280/c6BPbkO5Npt1OdwttAxCFo06wtH.jpg"),
  namedItem('movie', 37, "Minions & Monsters", 2026, 7.6, ["Adventure","Animation","Comedy"], "https://image.tmdb.org/t/p/w500/4LwvU9SZc8QQzW1X1FAPhNbXnEU.jpg", "https://image.tmdb.org/t/p/w1280/kkcwhgSFd81QDlXo8ytrpHPQjhy.jpg"),
  namedItem('movie', 38, "Colony", 2026, 8.1, ["Action","Horror","Sci-Fi"], "https://image.tmdb.org/t/p/w500/tN799oUR0f1gUKDYdMNrDaY7I51.jpg", "https://image.tmdb.org/t/p/w1280/84FEpVVbSKYvKXDZJDZXOKBxCEm.jpg"),
  namedItem('movie', 39, "Hotel Desire", 2011, 6.2, ["Drama","Romance"], "https://image.tmdb.org/t/p/w500/47XRWH95ATv4szxdWHl723guWXP.jpg", "https://image.tmdb.org/t/p/w1280/wcUohmHc9oDZXarXDp905TYVui4.jpg"),
  namedItem('movie', 40, "Evil Dead Burn", 2026, 7.8, ["Horror"], "https://image.tmdb.org/t/p/w500/uRxrNXQWkHoENm3nwVOZDYSCx2F.jpg", "https://image.tmdb.org/t/p/w1280/o0jkkpcN81QqSl8DMLScBCXyUH9.jpg"),
  namedItem('movie', 41, "Mourning Wife", 2001, 4.5, ["Drama","Romance"], "https://image.tmdb.org/t/p/w500/4cfd33evWkw8TPq95WkHeU82m8O.jpg", "https://image.tmdb.org/t/p/w1280/1KlBjmE84thylby7Y2OuR0ig3rg.jpg"),
  namedItem('movie', 42, "The Death of Robin Hood", 2026, 6.3, ["Adventure","Drama","Action"], "https://image.tmdb.org/t/p/w500/92Tsfx7SFafOqWsotvrlJbHyehd.jpg", "https://image.tmdb.org/t/p/w1280/lh3BDkmWJh998n4fQcHYcVi7dpm.jpg"),
  namedItem('movie', 43, "Backrooms", 2026, 7.1, ["Horror","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/rhGx6E3qRNMgj3i5su2oukNHwIQ.jpg", "https://image.tmdb.org/t/p/w1280/dqmMWNWfLnExDRpMtIMqI97GQFR.jpg"),
  namedItem('movie', 44, "Pinocchio: Unstrung", 2026, 6.9, ["Horror","Fantasy","Mystery"], "https://image.tmdb.org/t/p/w500/eUJXk3bTvLBi5Zcb0BCedZU7lVL.jpg", "https://image.tmdb.org/t/p/w1280/dNKFETDDujxm2PUN873Jwiw5VML.jpg"),
  namedItem('movie', 45, "Disclosure Day", 2026, 7.5, ["Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/AnJ8IQJI23hNpYXVNaythu061Ru.jpg", "https://image.tmdb.org/t/p/w1280/flxau5Iu7bChQHsESqvGZ3FQRaI.jpg"),
  namedItem('movie', 46, "Rosebush Pruning", 2026, 6.3, ["Comedy","Drama","Thriller"], "https://image.tmdb.org/t/p/w500/tXsTtSgguTsk5J115jokwK55awF.jpg", "https://image.tmdb.org/t/p/w1280/vcZ3UUVmFNk90DBSrTBlTKCdbbE.jpg"),
  namedItem('movie', 47, "The Last House", 2026, 6.9, ["Horror","Sci-Fi","Thriller"], "https://image.tmdb.org/t/p/w500/6JU7E8Vv2M11egkctWVOScxWR75.jpg", "https://image.tmdb.org/t/p/w1280/1RhfevWmWCVHtEqxWBEjPOC5KG1.jpg"),
  namedItem('movie', 48, "Greenland 2: Migration", 2026, 6.4, ["Adventure","Thriller","Sci-Fi"], "https://image.tmdb.org/t/p/w500/z2tqCJLsw6uEJ8nJV8BsQXGa3dr.jpg", "https://image.tmdb.org/t/p/w1280/cLFbDVfhllIMybpo2fkGNzehiQG.jpg"),
  namedItem('movie', 49, "Project Hail Mary", 2026, 8.6, ["Sci-Fi","Adventure"], "https://image.tmdb.org/t/p/w500/yihdXomYb5kTeSivtFndMy5iDmf.jpg", "https://image.tmdb.org/t/p/w1280/8Tfys3mDZVp4tNoH2ktm06a0Tau.jpg"),
  namedItem('movie', 50, "The End of Oak Street", 2026, 6.4, ["Sci-Fi","Mystery","Thriller"], "https://image.tmdb.org/t/p/w500/fYXqpgPmHMphSF2W30GbTeJVIa5.jpg", "https://image.tmdb.org/t/p/w1280/b9q9VmbXDvJmTziRqkwdEmFdwhr.jpg"),
  namedItem('movie', 51, "Shape of My Heart", 2024, 6.2, ["Romance"], "https://image.tmdb.org/t/p/w500/3r0O6BW9USoZ9mteCVyNKMQriRL.jpg", "https://image.tmdb.org/t/p/w1280/yjK3ardrgdS8suZG8KMU82Q7U38.jpg"),
  namedItem('movie', 52, "Scary Movie", 2026, 6.4, ["Comedy"], "https://image.tmdb.org/t/p/w500/znHT8peERZRWG1ME3r0Db0EV8k8.jpg", "https://image.tmdb.org/t/p/w1280/xWBiXclrRmTggQHMRsIn84YHavs.jpg"),
  namedItem('movie', 53, "Crazy Rich Asians", 2018, 7.0, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/1XxL4LJ5WHdrcYcihEZUCgNCpAW.jpg", "https://image.tmdb.org/t/p/w1280/zeHB7aP46Xs3u4aFLuAq2GFeUGb.jpg"),
  namedItem('movie', 54, "To All the Boys I've Loved Before", 2018, 7.2, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg", "https://image.tmdb.org/t/p/w1280/xXhta1NIKn09IXy0mfp68cabdWS.jpg"),
  namedItem('movie', 55, "Anyone But You", 2023, 6.3, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/5qHoazZiaLe7oFBok7XlUhg96f2.jpg", "https://image.tmdb.org/t/p/w1280/j9eOeLlTGoHoM8BNUJVNyWmIvCi.jpg"),
  namedItem('movie', 56, "The Proposal", 2009, 6.7, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/6stnAm1wSek8ZrislwK4xGTyCnt.jpg", "https://image.tmdb.org/t/p/w1280/ojgXOhVi9Yk8irDpRfDkIzdD1LK.jpg"),
  namedItem('movie', 57, "Pretty Woman", 1990, 7.1, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/hVHUfT801LQATGd26VPzhorIYza.jpg", "https://image.tmdb.org/t/p/w1280/sGEqHTylawwS6hwKultk1mKUjdB.jpg"),
  namedItem('movie', 58, "Notting Hill", 1999, 7.2, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/hHRIf2XHeQMbyRb3HUx19SF5Ujw.jpg", "https://image.tmdb.org/t/p/w1280/enTZhfxAdgOCdFdbj52MR3F10yC.jpg"),
  namedItem('movie', 59, "10 Things I Hate About You", 1999, 7.3, ["Romance", "Comedy"], "https://image.tmdb.org/t/p/w500/ujERk3aKABXU3NDXOAxEQYTHe9A.jpg", "https://image.tmdb.org/t/p/w1280/yvPbncYhMu9FfTjDhq0N5lgnVkO.jpg"),
]

const REAL_SHOWS = [
  namedItem('show', 1, "Stranger Things", 2016, 8.7, ["Sci-Fi","Horror","Drama"], "https://image.tmdb.org/t/p/w500/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg", "https://image.tmdb.org/t/p/w1280/56v2KjBlU4XaOv9rVYEQypROD7P.jpg"),
  namedItem('show', 2, "The Last of Us", 2023, 8.8, ["Drama","Adventure","Horror"], "https://image.tmdb.org/t/p/w500/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg", "https://image.tmdb.org/t/p/w1280/lY2DhbA7Hy44fAKddr06UrXWWaQ.jpg"),
  namedItem('show', 3, "The Mandalorian", 2019, 8.6, ["Sci-Fi","Adventure","Action"], "https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg", "https://image.tmdb.org/t/p/w1280/9zcbqSxdsRMZWHYtyCd1nXPr2xq.jpg"),
  namedItem('show', 4, "The Bear", 2022, 8.6, ["Comedy","Drama"], "https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg", "https://image.tmdb.org/t/p/w1280/aJtG4txtmiRHwAAqENQHZvBs6kY.jpg"),
  namedItem('show', 5, "Severance", 2022, 8.7, ["Mystery","Thriller","Drama"], "https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg", "https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg"),
  namedItem('show', 6, "Shogun", 2024, 8.6, ["Drama","History","Adventure"], "https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg", "https://image.tmdb.org/t/p/w1280/bwSmgmd90hCWwqOKQYTEraeOZhJ.jpg"),
  namedItem('show', 7, "The Crown", 2016, 8.6, ["Drama","History"], "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg", "https://image.tmdb.org/t/p/w1280/8VXhcrl5z2I1zEU9X3pkkNrZlD.jpg"),
  namedItem('show', 8, "Ted Lasso", 2020, 8.8, ["Comedy","Drama"], "https://image.tmdb.org/t/p/w500/uRHsiw1wLxPHFXkkv4Ix1s0O6f4.jpg", "https://image.tmdb.org/t/p/w1280/nE94ejEbzNCU48bW1oju0dqBONz.jpg"),
  namedItem('show', 9, "The Boys", 2019, 8.7, ["Action","Comedy","Sci-Fi"], "https://image.tmdb.org/t/p/w500/in1R2dDc421JxsoRWaIIAqVI2KE.jpg", "https://image.tmdb.org/t/p/w1280/n6vVs6z8obNbExdD3QHTr4Utu1Z.jpg"),
  namedItem('show', 10, "Wednesday", 2022, 8.1, ["Comedy","Fantasy","Mystery"], "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", "https://image.tmdb.org/t/p/w1280/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg"),
  namedItem('show', 11, "The Witcher", 2019, 8.1, ["Fantasy","Adventure","Action"], "https://image.tmdb.org/t/p/w500/AoGsDM02UVt0npBA8OvpDcZbaMi.jpg", "https://image.tmdb.org/t/p/w1280/foGkPxpw9h8zln81j63mix5B7m8.jpg"),
  namedItem('show', 12, "Slow Horses", 2022, 8.3, ["Thriller","Drama"], "https://image.tmdb.org/t/p/w500/w2jauz2PeSjFQifDObI3qDen4f7.jpg", "https://image.tmdb.org/t/p/w1280/bDfboQUb45Cv9MYyVBDZw8M8xSM.jpg"),
  namedItem('show', 13, "Only Murders in the Building", 2021, 8.1, ["Comedy","Mystery","Crime"], "https://image.tmdb.org/t/p/w500/1yjFVQZuW8aofZ5Cgol8iImsVFp.jpg", "https://image.tmdb.org/t/p/w1280/WCnEPf4ZNPjszndmrFlDxZ5Uvd.jpg"),
  namedItem('show', 14, "Bluey", 2018, 9.4, ["Animation","Family","Comedy"], "https://image.tmdb.org/t/p/w500/9p4pNoGcuyCfHcGWKNrTopqMWtq.jpg", "https://image.tmdb.org/t/p/w1280/lGFW6yOgVY9P9KqhiaPQfioPZ1c.jpg"),
  namedItem('show', 15, "Avatar: The Last Airbender", 2005, 9.3, ["Animation","Adventure","Family"], "https://image.tmdb.org/t/p/w500/yaGt4GIutpbXHsv48tWceWg6s56.jpg", "https://image.tmdb.org/t/p/w1280/7oBGhqJIghRBvOwo5Qe0yM0cnMc.jpg"),
  namedItem('show', 16, "The Office", 2005, 9, ["Comedy"], "https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg", "https://image.tmdb.org/t/p/w1280/mLyW3UTgi2lsMdtueYODcfAB9Ku.jpg"),
  namedItem('show', 17, "Reacher", 2022, 8.1, ["Action","Adventure","Crime"], "https://image.tmdb.org/t/p/w500/f1VCQIG2iCyOookdgOzwtUpwWC0.jpg", "https://image.tmdb.org/t/p/w1280/pF0qkRsrHkdYadPWY9AMeFZfcwk.jpg"),
  namedItem('show', 18, "The Mentalist", 2008, 8.4, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/acYXu4KaDj1NIkMgObnhe4C4a0T.jpg", "https://image.tmdb.org/t/p/w1280/q3pCsNvJ7CmdJUz2sJEEUY3pOPC.jpg"),
  namedItem('show', 19, "Lioness", 2023, 8.1, ["Drama","War"], "https://image.tmdb.org/t/p/w500/rzpHPSEgPTpRs8EHbygwsOw7jC0.jpg", "https://image.tmdb.org/t/p/w1280/4NBYDOnEjAzyuP7CMkD5s7fs44K.jpg"),
  namedItem('show', 20, "Outer Banks", 2020, 8.2, ["Action","Adventure","Mystery"], "https://image.tmdb.org/t/p/w500/ovDgO2LPfwdVRfvScAqo9aMiIW.jpg", "https://image.tmdb.org/t/p/w1280/fjJ0aqDeDXFzmFXXJ4CF3ryB19b.jpg"),
  namedItem('show', 21, "Lanterns", 2026, 8.2, ["Drama","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/gpC7h43xPMEV3goYMQShfJbTtLq.jpg", "https://image.tmdb.org/t/p/w1280/mdbWfpbWhvxgG3k5MHpo90UgAUe.jpg"),
  namedItem('show', 22, "Paradise Hotel", 2005, 5.6, ["Drama"], "https://image.tmdb.org/t/p/w500/ycSBcACecVR0zSnP2ZF83k5f7he.jpg", "https://image.tmdb.org/t/p/w1280/nun8Ssmni886Ib4v7chgQbswDfl.jpg"),
  namedItem('show', 23, "Tagesschau", 1952, 6.8, ["Drama"], "https://image.tmdb.org/t/p/w500/7dFZJ2ZJJdcmkp05B9NWlqTJ5tq.jpg", "https://image.tmdb.org/t/p/w1280/jWXrQstj7p3Wl5MfYWY6IHqRpDb.jpg"),
  namedItem('show', 24, "Silo", 2023, 8.2, ["Sci-Fi","Fantasy","Drama"], "https://image.tmdb.org/t/p/w500/gMYZZvnkVNTqSVnVCphWbPXwWwb.jpg", "https://image.tmdb.org/t/p/w1280/uTWhbLc7Bj4qNSdW3ZvZKL8cOHv.jpg"),
  namedItem('show', 25, "Law & Order: Special Victims Unit", 1999, 8, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/iofokHZoUB4Qhik4PflvJl8TT6a.jpg", "https://image.tmdb.org/t/p/w1280/obtdxPgmfykYwVnvuYXC5f2xKlQ.jpg"),
  namedItem('show', 26, "Gran hermano", 2001, 4.5, ["Drama"], "https://image.tmdb.org/t/p/w500/snIRCY6Qhei08YUNQjjZI2gc4CK.jpg", "https://image.tmdb.org/t/p/w1280/1E8PabwfDIaxREyfe9fxfINqauu.jpg"),
  namedItem('show', 27, "Family Guy", 1999, 7.4, ["Animation","Comedy"], "https://image.tmdb.org/t/p/w500/3PFsEuAiyLkWsP4GG6dIV37Q6gu.jpg", "https://image.tmdb.org/t/p/w1280/l7wShoIdIUwaDIbsHno9pO5MZXT.jpg"),
  namedItem('show', 28, "The Rookie", 2018, 8.5, ["Crime","Drama","Comedy"], "https://image.tmdb.org/t/p/w500/70kTz0OmjjZe7zHvIDrq2iKW7PJ.jpg", "https://image.tmdb.org/t/p/w1280/6iNWfGVCEfASDdlNb05TP5nG0ll.jpg"),
  namedItem('show', 29, "Grey's Anatomy", 2005, 8.2, ["Drama"], "https://image.tmdb.org/t/p/w500/hjJkrLXhWvGHpLeLBDFznpBTY1S.jpg", "https://image.tmdb.org/t/p/w1280/jP0Rhj9OTPDAwQlHQwOLFDdeE8t.jpg"),
  namedItem('show', 30, "The Simpsons", 1989, 8, ["Animation","Comedy"], "https://image.tmdb.org/t/p/w500/uWpG7GqfKGQqX4YMAo3nv5OrglV.jpg", "https://image.tmdb.org/t/p/w1280/jIArNHIekrCSVgdMbKPAXpPY03Y.jpg"),
  namedItem('show', 31, "Watch What Happens Live with Andy Cohen", 2009, 4.9, ["Comedy"], "https://image.tmdb.org/t/p/w500/onSD9UXfJwrMXWhq7UY7hGF2S1h.jpg", "https://image.tmdb.org/t/p/w1280/hINekSpbcBxjnjGqmIm6I4bz2ab.jpg"),
  namedItem('show', 32, "The Tonight Show Starring Jimmy Fallon", 2014, 5.8, ["Comedy"], "https://image.tmdb.org/t/p/w500/1N4o5PmmqhlVDrcdJ2RlCFWbLGX.jpg", "https://image.tmdb.org/t/p/w1280/7VO04TtL1jIT6XOPs9u4jdB8KaB.jpg"),
  namedItem('show', 33, "House of the Dragon", 2022, 8.4, ["Sci-Fi","Fantasy","Drama"], "https://image.tmdb.org/t/p/w500/7V0Ebks0GgpKvQ7QbLAIdX5dos4.jpg", "https://image.tmdb.org/t/p/w1280/577eXC8wFQT0eUrJcgznSiFPRmk.jpg"),
  namedItem('show', 34, "NCIS", 2003, 7.6, ["Crime","Drama","Action"], "https://image.tmdb.org/t/p/w500/mBcu8d6x6zB1el3MPNl7cZQEQ31.jpg", "https://image.tmdb.org/t/p/w1280/nn3SuLTO4hum8yAxaY4ql8h6kRk.jpg"),
  namedItem('show', 35, "Supernatural", 2005, 8.3, ["Drama","Mystery","Sci-Fi"], "https://image.tmdb.org/t/p/w500/8iixmfGx5EIFPdpNvB2JvI3VIqX.jpg", "https://image.tmdb.org/t/p/w1280/ro0tlgnsco4SwbdAgmscLkSlMSL.jpg"),
  namedItem('show', 36, "Criminal Minds", 2005, 8.3, ["Crime","Drama","Mystery"], "https://image.tmdb.org/t/p/w500/hWSb4UnIjlTvnvrP98NbFSO60HA.jpg", "https://image.tmdb.org/t/p/w1280/tUtXfyVy54BY7eJnRtI8Xnmr1ZL.jpg"),
  namedItem('show', 37, "Emily in Paris", 2020, 6.9, ["Romance", "Comedy", "Drama"], "https://image.tmdb.org/t/p/w500/c0bkO416OU7YGdOFktk45H8REgL.jpg", "https://image.tmdb.org/t/p/w1280/jXTZaHarR9TZiMoQwiQWsGYXqnS.jpg"),
  namedItem('show', 38, "Never Have I Ever", 2020, 7.8, ["Romance", "Comedy", "Drama"], "https://image.tmdb.org/t/p/w500/hd5fnBixab6IzfUwjC5wfdbX3eM.jpg", "https://image.tmdb.org/t/p/w1280/umVYLVZ7T85TkIHudxK799lPnLQ.jpg"),
]

const MOVIES = [...REAL_MOVIES]
const SHOWS = [...REAL_SHOWS]

function episodeDurationFor(item, index, number) {
  const genres = new Set((item.genres ?? []).map((genre) => String(genre).toLowerCase()))
  const kidsShort =
    genres.has('family') && genres.has('comedy') && !genres.has('adventure') && !genres.has('action')
  if (kidsShort) return 7
  if (genres.has('animation') && (genres.has('comedy') || genres.has('family'))) return 22
  if (genres.has('comedy') && !genres.has('crime') && !genres.has('drama') && !genres.has('sci-fi') && !genres.has('action')) {
    return 22
  }
  if (genres.has('comedy') && genres.has('drama') && !genres.has('crime')) return 30
  return 42 + ((index + number) % 10)
}

function seasonsFor(item, index) {
  const known = {
    'The Office': 9,
    'The Simpsons': 8,
    "Grey's Anatomy": 7,
    Supernatural: 6,
    NCIS: 6,
    'Criminal Minds': 5,
    'Family Guy': 5,
    "Law & Order: Special Victims Unit": 6,
    'The Rookie': 4,
    'Avatar: The Last Airbender': 3,
    'House of the Dragon': 2,
    Reacher: 3,
    Silo: 2,
    'Outer Banks': 4,
  }
  const seasonCount = known[item.title] ?? 1 + (index % 3)
  const episodeCount = 8 + (index % 5)
  const seasons = []
  for (let seasonNumber = 1; seasonNumber <= seasonCount; seasonNumber += 1) {
    const episodes = []
    for (let number = 1; number <= episodeCount; number += 1) {
      episodes.push({
        id: `${item.id}-s${seasonNumber}e${number}`,
        number,
        title: episodeTitleFor(item, seasonNumber, number),
        duration: episodeDurationFor(item, index, number),
        synopsis: episodeSynopsisFor(item, seasonNumber, number),
        thumb_url: item.backdrop_url || `/art/thumb/${item.id}?s=${seasonNumber}&e=${number}`,
        watch_href: `/watch/play/${item.id}?s=${seasonNumber}&e=${number}`,
      })
    }
    seasons.push({ season_number: seasonNumber, episodes })
  }
  return seasons
}

const ALL = [...MOVIES, ...SHOWS]
const BY_ID = new Map(ALL.map((item) => [item.id, item]))

export function listMovies() {
  return MOVIES
}

export function listShows() {
  return SHOWS
}

export function homepageRows() {
  const featuredMovies = [...MOVIES].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 24)
  const featuredShows = [...SHOWS].sort((a, b) => (b.year ?? 0) - (a.year ?? 0)).slice(0, 16)
  const seen = new Set()
  const mixed = []
  for (const item of [...featuredMovies, ...featuredShows]) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    mixed.push(item)
  }
  return mixed
}

export function searchItems(q) {
  const needle = q.trim().toLowerCase()
  if (needle.length < 2) return []
  return ALL.filter((item) => {
    if (item.title.toLowerCase().includes(needle)) return true
    if (item.genres.some((genre) => genre.toLowerCase().includes(needle))) return true
    const index = Number(item.id.slice(0, 4))
    if (castFor(index).some((name) => name.toLowerCase().includes(needle))) return true
    if (item.kind === 'show' && creatorsFor(index).some((name) => name.toLowerCase().includes(needle))) return true
    if (item.kind === 'movie' && directorFor(index).toLowerCase().includes(needle)) return true
    return item.kind === 'movie' && writersFor(index).some((name) => name.toLowerCase().includes(needle))
  })
}

export function catalogPage(kind, opts = {}) {
  const source = kind === 'shows' ? SHOWS : MOVIES
  const genre = opts.genre?.trim().toLowerCase()
  const filtered = genre
    ? source.filter((item) => item.genres.some((name) => name.toLowerCase() === genre))
    : source
  const page = Math.max(1, Number(opts.page) || 1)
  const start = (page - 1) * PAGE_SIZE
  const items = filtered.slice(start, start + PAGE_SIZE)
  const next = start + PAGE_SIZE < filtered.length ? page + 1 : null
  return { items, next }
}

export function getDetail(kind, id) {
  const item = BY_ID.get(id)
  if (!item) return null
  if (kind === 'movie' && item.kind !== 'movie') return null
  if (kind === 'show' && item.kind !== 'show') return null
  const index = Number(item.id.slice(0, 4))
  const detail = {
    ...item,
    synopsis: synopsisFor(item),
    runtime: item.kind === 'movie' ? 96 + (index % 48) : 28 + (index % 22),
    cast: castFor(index),
    creators: item.kind === 'show' ? creatorsFor(index) : undefined,
    director: item.kind === 'movie' ? directorFor(index) : undefined,
    writers: item.kind === 'movie' ? writersFor(index) : undefined,
    backdrop_url: item.backdrop_url || `/art/backdrop/${item.id}?v=2`,
    watch_href: `/watch/play/${item.id}`,
  }
  if (item.kind === 'show') {
    detail.seasons = seasonsFor(item, index)
  }
  return detail
}

export function getItem(id) {
  return BY_ID.get(id) ?? null
}

export const COUNTS = { movies: MOVIES.length, shows: SHOWS.length, genres: GENRES.length }
