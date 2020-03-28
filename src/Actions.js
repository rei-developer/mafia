const Serialize = require('./protocol/Serialize')
const { TeamType } = require('./util/const')
const pix = require('./util/pix')

const dr = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, 0]
]

class State {
    constructor(args = {}) { }

    doAction(context, self) { }

    update(context) { }
}

class DoorState {
    constructor(args = {}) {
        this.openSound = args['openSound'] || 'door03'
        this.closeSound = args['closeSound'] || 'door04'
        this.knockSound = args['knockSound'] || 'door06'
        this.isOpen = false
        this.isAlive = true
    }

    doAction(context, self) {
        const door = context
        if (this.isAlive) {
            if (this.isOpen) {
                if (self.game.team === TeamType.RED) return
                self.publishToMap(Serialize.PlaySound(2, this.closeSound))
                door.move(-1, 0)
                this.isOpen = false
            } else {
                const max = self.game.team === TeamType.RED ? 10 : 0
                let r = parseInt(Math.random() * max)
                if (r === 0) {
                    self.publishToMap(Serialize.PlaySound(2, this.openSound))
                    door.move(1, 0)
                    this.isOpen = true
                    if (self.game.team === TeamType.RED) {
                        r = parseInt(Math.random() * 10)
                        if (r === 0) this.isAlive = false
                    }
                } else self.publishToMap(Serialize.PlaySound(2, this.knockSound))
            }
        } else self.send(Serialize.InformMessage('<color=red>오니가 철창문을 고장냈다.</color>'))
    }
}

class ManiaState {
    constructor(args = {}) {
        this.count = 0
        this.step = 0
        this.i = 0
        this.msgCount = -1
        this.message = args['message'] // || ['허허... 좀 비켜보시게나.']
        this.fixed = args['fixed']
    }

    doAction(context, self) {
        this.msgCount = (++this.msgCount) % this.message.length
        self.send(Serialize.ChatMessage(context.type, context.index, context.name, this.message[this.msgCount]))
    }

    update(context) {
        if (this.fixed) return
        const room = Room.get(context.roomId)
        if (!room) return
        if (this.step <= 0) {
            this.i = parseInt(Math.random() * 4)
            this.step = parseInt(Math.random() * 5) + 1
        }
        context.dirty = true
        let i = this.i
        --this.step
        context.direction.x = dr[i][0]
        context.direction.y = -dr[i][1]
        const direction = context.getDirection(dr[i][0], -dr[i][1])
        if (room.isPassable(context.place, context.x, context.y, direction, false) && room.isPassable(context.place, context.x + dr[i][0], context.y + dr[i][1], 10 - direction, true)) {
            context.x += dr[i][0]
            context.y += dr[i][1]
        }
        this.count++
        if (this.count % 500 == 0) {
            this.msgCount = (++this.msgCount) % this.message.length
            context.publishToMap(Serialize.ChatMessage(context.type, context.index, context.name, this.message[this.msgCount]))
        }
        if (this.count > 1500) this.count = 0
    }
}

module.exports = new Proxy({
    door: DoorState,
    mania: ManiaState
}, {
    get: function (target, name) {
        return target.hasOwnProperty(name) ? target[name] : State
    }
})