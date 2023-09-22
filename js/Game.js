class Game {
  constructor() {
    this.reset = createButton("")
    this.leaderboard = createElement("h2")
    this.leader1 = createElement("h2")
    this.leader2 = createElement("h2")
    this.playerMoving = false
    this.leftKeyActive = false
    this.blast = false
  }

  getState() {
    database.ref("gameState").on("value", x => {
      gameState = x.val()
    })
  }

  updateState(x) {
    database.ref("/").update({
      gameState: x
    })
  }

  start() {
    form = new Form();
    form.display();
    player = new Player();
    playerCount = player.getCount()

    car1 = createSprite(width / 2 - 50, height - 100)
    car1.addImage(c1)
    car1.scale = 0.07

    car2 = createSprite(width / 2 + 100, height - 100)
    car2.addImage(c2)
    car2.scale = 0.07

    cars = [car1, car2]

    car1.addImage("blast", blast)
    car2.addImage("blast", blast)

    fuels = new Group()
    coins = new Group()
    obstacles = new Group()

    var obPositions = [
      { x: width / 2 + 250, y: height - 800, image: ob2 },
      { x: width / 2 - 180, y: height - 2300, image: ob2 },
      { x: width / 2, y: height - 2800, image: ob2 },
      { x: width / 2 + 180, y: height - 3300, image: ob2 },
      { x: width / 2 + 250, y: height - 3800, image: ob2 },
      { x: width / 2 + 250, y: height - 4800, image: ob2 },
      { x: width / 2 - 180, y: height - 5500, image: ob2 },
      { x: width / 2 - 150, y: height - 1300, image: ob1 },
      { x: width / 2 + 250, y: height - 1800, image: ob1 },
      { x: width / 2 - 180, y: height - 3300, image: ob1 },
      { x: width / 2 - 150, y: height - 4300, image: ob1 },
      { x: width / 2, y: height - 5300, image: ob1 },
    ]

    this.addSprites(fuels, 4, fuel, 0.02)
    this.addSprites(coins, 20, coin, 0.09)
    this.addSprites(obstacles, obPositions.length, ob1, 0.04, obPositions)

  }

  addSprites(group, number, image, scale, positions = []) {
    for (var i = 0; i < number; i++) {
      var x, y
      if (positions.length > 0) {
        x = positions[i].x
        y = positions[i].y
        image = positions[i].image
      } else {
        x = random(width / 2 + 150, width / 2 - 150)
        y = random(-height * 4.5, height - 400)
      }
      var sprite = createSprite(x, y)
      sprite.addImage(image)
      sprite.scale = scale
      group.add(sprite)
    }
  }


  handleElements() {
    form.hide()
    form.titleImg.position(40, 50)
    form.titleImg.class("changeTitlePosition")

    this.reset.class("resetButton")
    this.reset.position(width / 2 + 230, 50)

    this.leaderboard.html("LEADERBOARD")
    this.leaderboard.class("resetText")
    this.leaderboard.position(width / 3 - 60, 40)

    this.leader1.class("leadersText")
    this.leader1.position(width / 3 - 50, 80)

    this.leader2.class("leadersText")
    this.leader2.position(width / 3 - 50, 130)
  }

  play() {
    this.handleElements()
    this.handleResetButton()
    Player.getPlayersInfo()
    player.getCarsAtEnd()
    if (allPlayers !== undefined) {
      image(track, 0, -height * 5, width, height * 6)
      this.showLeaderBoard()
      this.showFuelBar()
      this.showLifeBar()
      var index = 0
      for (var plr in allPlayers) {
        index += 1
        var x = allPlayers[plr].positionX
        var y = height - allPlayers[plr].positionY
        var currentLife = allPlayers[plr].life
        if (currentLife <= 0) {
          cars[index - 1].changeImage("blast")
          cars[index - 1].scale = 0.3
        }

        cars[index - 1].position.x = x
        cars[index - 1].position.y = y
        if (index === player.index) {
          fill("Black")
          ellipse(x, y, 70, 70)
          camera.position.x = width / 2
          camera.position.y = cars[index - 1].position.y
          this.handleFuel(index)
          this.handleCoins(index)
          this.handleObstacleCollision(index)
          this.handleCarCollision(index)

          if (player.life <= 0) {
            this.blast = true
            gameState = 2
            this.gameOver()
          }
        }
      }
      const finishLine = height * 6 - 100
      if (player.positionY > finishLine) {
        gameState = 2
        player.rank += 1
        Player.updateCarsAtEnd(player.rank)
        player.update()
        this.showRank()
      }
      this.handlePlayerControls()
      drawSprites()
    }
  }
  handlePlayerControls() {
    if (!this.blast) {
      if (keyIsDown(UP_ARROW)) {
        this.playerMoving = true
        player.positionY += 10
        player.update()
      }
      if (keyIsDown(LEFT_ARROW) && player.positionX > width / 3 - 50) {
        this.leftKeyActive = true
        player.positionX -= 5
        player.update()
      }
      if (keyIsDown(RIGHT_ARROW) && player.positionX < width / 2 + 300) {
        this.leftKeyActive = false
        player.positionX += 5
        player.update()
      }
    }
  }

  handleResetButton() {
    this.reset.mousePressed(() => {
      database.ref("/").set({
        playerCount: 0,
        gameState: 0,
        players: {},
        carsAtEnd: 0
      })
      window.location.reload()
    })
  }
  showLeaderBoard() {
    var leader1, leader2
    var players = Object.values(allPlayers)

    if (
      (players[0].rank === 0 && players[1].rank === 0) || players[0].rank === 1
    ) {
      leader1 = players[0].rank + "&emsp;" + players[0].name + "&emsp;" + players[0].score
      leader2 = players[1].rank + "&emsp;" + players[1].name + "&emsp;" + players[1].score
    }
    if (players[1].rank === 1) {
      leader1 = players[1].rank + "&emsp;" + players[1].name + "&emsp;" + players[1].score
      leader2 = players[0].rank + "&emsp;" + players[0].name + "&emsp;" + players[0].score
    }
    this.leader1.html(leader1)
    this.leader2.html(leader2)
  }

  handleFuel(index) {
    cars[index - 1].overlap(fuels, function (collector, collected) {
      player.fuel = 200
      collected.remove()
    })
    if (player.fuel > 0 && this.playerMoving) {
      player.fuel -= 0.4
    }
    if (player.fuel <= 0) {
      gameState = 2
      this.gameOver()
    }
  }
  handleCoins(index) {
    cars[index - 1].overlap(coins, function (collector, collected) {
      player.score += 10
      player.update()
      collected.remove()
    })
  }
  showRank() {
    swal({
      title: `Awesome!${"\n"}Rank${"\n"}${player.rank}`,
      text: "You Reached The Finish Line Successfuly",
      imageUrl: "https://raw.githubusercontent.com/vishalgaddam873/p5-multiplayer-car-race-game/master/assets/cup.png",
      imageSize: "100x100",
      confirmButtonText: "Okay"
    })
  }
  gameOver() {
    swal({
      title: `Game Over`,
      text: "Oops You Lost The Race",
      imageUrl: "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Down_Sign_Emoji_Icon_ios10_grande.png",
      imageSize: "100x100",
      confirmButtonText: "Thanks For Playing"
    })
  }
  showFuelBar() {
    push()
    image(fuel, width / 2 - 130, height - player.positionY - 450, 20, 20)
    fill("white")
    rect(width / 2 - 100, height - player.positionY - 450, 200, 20)
    fill("orange")
    rect(width / 2 - 100, height - player.positionY - 450, player.fuel, 20)
    pop()
  }
  showLifeBar() {
    push()
    image(life, width / 2 - 130, height - player.positionY - 500, 20, 20)
    fill("white")
    rect(width / 2 - 100, height - player.positionY - 500, 200, 20)
    fill("red")
    rect(width / 2 - 100, height - player.positionY - 500, player.life, 20)
    pop()
  }
  handleObstacleCollision(index) {
    if (cars[index - 1].collide(obstacles)) {
      if (player.life > 0) {
        player.life -= 50
      }
      player.update()
      if (this.leftKeyActive) {
        player.positionX += 100
      } else {
        player.positionX -= 100
      }
    }
  }

  handleCarCollision(index){
    if(index == 1){
      if (cars[index - 1].collide(cars[1])) {
        if (player.life > 0) {
          player.life -= 50
        }
        player.update()
        if (this.leftKeyActive) {
          player.positionX += 100
        } else {
          player.positionX -= 100
        }
      }
    }
    if(index == 2){
      if (cars[index - 1].collide(cars[0])) {
        if (player.life > 0) {
          player.life -= 50
        }
        player.update()
        if (this.leftKeyActive) {
          player.positionX += 100
        } else {
          player.positionX -= 100
        }
      }
    }
  }
}