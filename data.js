const foreName = [
  "Adamant",
  "Adaptable",
  "Adorable",
  "Adventurous",
  "Agreeable",
  "Amazing",
  "Ambitious",
  "Amused",
  "Angry",
  "Awesome",
  "Big",
  "Blushing",
  "Bouncy",
  "Brainy",
  "Brave",
  "Busy",
  "Calm",
  "Capable",
  "Caring",
  "Charming",
  "Cheerful",
  "Classy",
  "Clumsy",
  "Common",
  "Cool",
  "Cuddly",
  "Cultured",
  "Curious",
  "Cute",
  "Determined",
  "Enchanted",
  "Energetic",
  "Excited",
  "Fabulous",
  "Faithful",
  "Famous",
  "Fancy",
  "Fluffy",
  "Friendly",
  "Gentle",
  "Goofy",
  "Groovy",
  "Handsome",
  "Happy",
  "Imaginary",
  "Innocent",
  "Invincible",
  "Kind",
  "Lazy",
  "Little",
  "Loud",
  "Magical",
  "Modern",
  "Mysterious",
  "Observant",
  "Ordinary",
  "Peaceful",
  "Polite",
  "Proud",
  "Puzzled",
  "Quiet",
  "Rare",
  "Sassy",
  "Shiny",
  "Shy",
  "Simple",
  "Sleepy",
  "Smart",
  "Strange",
  "Wild",
  "Witty",
  "Young",
];
const lastName = [
  "Albatross",
  "Alligator",
  "Alpaca",
  "Ant",
  "Antelope",
  "Badger",
  "Bat",
  "Bear",
  "Beaver",
  "Bee",
  "Bison",
  "Camel",
  "Capybara",
  "Cat",
  "Cheetah",
  "Chicken",
  "Chinchilla",
  "Cobra",
  "Coyote",
  "Crab",
  "Crane",
  "Crocodile",
  "Crow",
  "Deer",
  "Dinosaur",
  "Dog",
  "Dolphin",
  "Dove",
  "Dragonfly",
  "Duck",
  "Eagle",
  "Echidna",
  "Eel",
  "Elephant",
  "Emu",
  "Falcon",
  "Ferret",
  "Finch",
  "Flamingo",
  "Fox",
  "Frog",
  "Gerbil",
  "Giraffe",
  "Goose",
  "Grasshopper",
  "Hamster",
  "Hawk",
  "Hedgehog",
  "Hippo",
  "Horse",
  "Hummingbird",
  "Jaguar",
  "Jellyfish",
  "Kangaroo",
  "Koala",
  "Kookabura",
  "Lemur",
  "Leopard",
  "Lion",
  "Llama",
  "Lobster",
  "Magpie",
  "Manatee",
  "Mongoose",
  "Moose",
  "Mouse",
  "Octopus",
  "Okapi",
  "Opossum",
  "Ostrich",
  "Otter",
  "Owl",
  "Panther",
  "Parrot",
  "Pelican",
  "Penguin",
  "Pigeon",
  "Pony",
  "Porcupine",
  "Rabbit",
  "Raccoon",
  "Raven",
  "Salamander",
  "Scorpion",
  "Seahorse",
  "Seal",
  "Shark",
  "Sheep",
  "Snake",
  "Sparrow",
  "Spider",
  "Spoonbill",
  "Squid",
  "Squirrel",
  "Swan",
  "Tapir",
  "Tiger",
  "Turtle",
  "Wallaby",
  "Weasel",
  "Wolf",
  "Wolverine",
  "Wombat",
  "Woodpecker",
  "Zebra",
];
const chars =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(""); // Array mit allen Buchstaben und Zahlen

async function randomName() {
  return foreName[Math.floor(Math.random() * foreName.length)] + lastName[Math.floor(Math.random() * lastName.length)]
}

async function randomRoom() {
  let random = "";
  for (let i = 0; i < 9; i++) {
    random = random + chars[Math.floor(Math.random() * chars.length)];
  }
  return random;
}

async function createDeck() {
  let signs = ["A", "B", "C", "D"]; // A: diamond B: clubs C: hearts D: spades

  // create the card deck
  let deck = [];
  for (let i = 0; i < signs.length; i++) {
    for (let j = 3; j <= 15; j++) {
      // J:11, Q:12, K:13, A:14, 2:15
      deck.push({ sign: signs[i], num: j });
    }
  }
  deck.push({ sign: "E", num: 16 }, { sign: "F", num: 16 });
  return await randomizeOrder(deck);
}

async function randomizeOrder(array) {
  return await array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

exports.createDeck = createDeck;
exports.randomName = randomName;
exports.randomRoom = randomRoom;
exports.randomizeOrder = randomizeOrder;
