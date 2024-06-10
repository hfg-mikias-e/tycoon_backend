const data = require("./data.js")
const express = require("express")
const app = express()
const http = require("http").createServer(app)

const io = require("socket.io")(http, {
  cors: {
    origin: [process.env.VUE_APP_ENDPOINT],
  },
})

app.get("/", (req, res) => {
  res.send("<h1>Hey Socket.io</h1>")
})

// global variables
const maxPlayers = 4
let clients = []
let rooms = []

io.on("connection", (socket) => {
  // user variables
  const socketID = socket.id
  let userID = ""

  console.log(socketID)
  socket.emit("tested")

  socket.on("test", () => {
    console.log("test")
  })

  /* ----------------- FUNCTIONS ----------------------- */

  async function generateName() {
    // get all names of players currently online
    const currentPlayerNames = clients.flatMap((index) => index.name)
    let randomName = await data.randomName()

    while (currentPlayerNames.includes(randomName)) {
      randomName = await data.randomName()
    }
    return randomName
  }

  async function changeRoom(availableRoom, action) {
    const roomID = availableRoom.id

    if (action === "join") {
      if (!availableRoom.started && availableRoom.players.length < maxPlayers) {
        // add user to the room if it isn't full or ingame yet
        availableRoom.players.push({ id: userID, ready: false })
        socket.join(roomID)
      }
    } else if (action === "leave") {
      // remove user from the room
      await availableRoom.players.splice(availableRoom.players.findIndex(index => index.id === userID), 1)
      socket.leave(roomID)
    }

    // remove possible duplicates
    availableRoom.players = [...new Set(availableRoom.players)]
    io.to(roomID).emit("updateRoom", availableRoom.players)

    // if empty, set room back to open (not started)
    if(availableRoom.players.length === 0) {
      availableRoom.started = false
    }

    // remove non-party rooms without players
    rooms = rooms.filter(index => index.players.length > 0 || index.type === "party")
  }

  async function sortCards(cards) {
    let sortedCards = cards

    // sort hands in ascending order by sign and number for every player
    await sortedCards.sort((a, b) => {
      if (a.sign < b.sign) {
        return -1
      }
      if (a.sign > b.sign) {
        return 1
      }
      return 0
    })

    await sortedCards.sort((a, b) => a.num - b.num)
    return sortedCards
  }

  /* ----------------- CONNECT AND JOIN LOGIC ----------------------- */

  socket.on("connectUser", async (newUser) => {
    userID = newUser
    const userName = await generateName()

    // add the user as a client if not logged on already (prevent doubles within the same browser)
    if (!clients.some((index) => index.id === userID)) {
      clients.push({ id: userID, socket: socketID, name: userName })
      io.emit("updateUsers", clients)

      console.log("let a user join!")
    }
  })

  socket.on("findGame", async (roomType) => {
    let roomID = ""

    // check for existing non-party-rooms that aren't full or have not started yet
    const availableCondition = (index) => index.players.length < maxPlayers && index.type === "random" && !index.started
    if (roomType === "random" && rooms.some(availableCondition)) {
      roomID = await rooms.find(availableCondition).id
    } else {
      // create a new roomID if all random rooms full, started, or if it's a party.
      const newRoom = await data.randomRoom()
      rooms.push({ id: newRoom, players: [], type: roomType, started: false })
      roomID = newRoom
    }

    socket.emit("joinRoom", roomID, roomType)
  })

  socket.on("checkForParty", (clipboardString) => {
    let party = ""

    for (const room of rooms) {
      if (clipboardString.includes(room.id)) {
        party = room.id
      }
    }

    socket.emit("partyExists", party)
  })

  socket.on("moveRoom", (roomID, action) => {
    const roomIndex = rooms.findIndex((index) => index.id === roomID)
    if (roomIndex >= 0) {
      changeRoom(rooms[roomIndex], action)
    } else {
      socket.emit("redirectBack")
    }
  })

  socket.on("disconnect", () => {
    console.log("disconnected")
    // remove user with corresponding socketID from clients (if joined before)
    if (clients.map(index => index.socket).includes(socketID)) {
      clients = clients.filter(index => index.socket !== socketID)
      io.emit("updateUsers", clients)

      console.log("disconnected a user.")

      // also remove from any rooms
      // -> look for the userID inside all rooms
      const roomIndex = rooms.findIndex(index => index.players.some(index => index.id === userID))
      if (roomIndex >= 0) {
        changeRoom(rooms[roomIndex], "leave")
      }
    }
  })

  /* ----------------- LOBBY READY AND START LOGIC ----------------------- */

  socket.on("setReady", async (roomID, userID, ready) => {
    const players = await rooms.find((index) => index.id === roomID).players
    players.find(index => index.id === userID).ready = ready

    io.to(roomID).emit("updateRoom", players)
  })

  socket.on("setLoaded", (roomID, userID) => {
    io.to(roomID).emit("addLoaded", userID)
  })

  socket.on("startGame", (roomID, started) => {
    rooms.find((index) => index.id === roomID).started = started
  })

  /* ----------------- GAME ACTIONS LOGIC ----------------------- */

  socket.on("getCards", async (roomID) => {
    const playerNumber = await rooms.find(index => index.id === roomID).players.length
    console.log(playerNumber)

    // shuffle and adjust size of deck to the number of players (max. 14 cards per player)
    let deck = await data.createDeck()
    deck = await deck.slice(0, (playerNumber * 14))

    // create individual player hands
    let hands = []
    for (let i = 0; i < playerNumber; i++) {
      hands.push([])
    }

    // handout cards for all player hands
    while (deck.length > 0) {
      for (let i = 0; i < playerNumber; i++) {
        hands[i].push(deck[0])
        // remove the first index
        await deck.shift()

        if (deck.length <= 0) {
          break
        }
      }
    }

    for (let i = 0; i < hands.length; i++) {
      hands[i] = await sortCards(hands[i])
    }

    // TODO: randomize in the first round, in later rounds when ranks exist give bigger number of cards to rich and tycoon
    const gameDeck = await data.randomizeOrder(hands)
    console.log(gameDeck)

    // give first turn to the player with 3 of diamonds, otherwise pick a random player
    let firstTurn = gameDeck.findIndex(index => index.some(card => card.num === 3 && card.sign === "A"))
    if (firstTurn < 0) {
      firstTurn = Math.floor(Math.random() * gameDeck.length)
    }

    io.to(roomID).emit("giveCards", gameDeck, firstTurn)
  })

  socket.on("playCards", async (roomID, playedCards) => {
    const cards = await sortCards(playedCards)
    io.to(roomID).emit("newCurrentCards", cards)
  })

  socket.on("passTurn", (roomID) => {
    io.to(roomID).emit("passTurn")
  })

  socket.on("setRank", (roomID, userID) => {
    io.to(roomID).emit("setRank", userID)
  })
})

http.listen(process.env.PORT || 4000, () => {
  console.log("listening!")
})
