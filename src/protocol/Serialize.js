const { TeamType, RoomType } = require('../util/const')
const ToClient = require('./ToClient')
const moment = require('moment')
const my = {}

my.UserData = function (user) {
    const packet = {}
    packet._head = ToClient.USER_DATA
    packet.index = user.index
    packet.id = user.id
    packet.clanname = user.clan && user.clan.name || ''
    packet.name = user.name
    packet.rank = user.rank
    packet.level = user.level
    packet.exp = user.exp
    packet.maxExp = user.maxExp
    packet.coin = user.coin
    packet.cash = user.cash
    packet.point = user.point
    packet.win = user.win
    packet.lose = user.lose
    packet.escape = user.escape
    packet.rankWin = user.rankWin
    packet.rankLose = user.rankLose
    packet.rankEscape = user.rankEscape
    packet.graphics = user.graphics
    packet.pureGraphics = user.pureGraphics
    packet.deadGraphics = user.deadGraphics
    packet.memo = user.memo
    packet.admin = user.admin
    return JSON.stringify(packet)
}

my.Vibrate = function () {
    const packet = {}
    packet._head = ToClient.VIBRATE
    return JSON.stringify(packet)
}

my.ConnectionCount = function (count) {
    const packet = {}
    packet._head = ToClient.CONNECTION_COUNT
    packet.count = count
    return JSON.stringify(packet)
}

my.SystemMessage = function (message, color = '') {
    const packet = {}
    packet._head = ToClient.SYSTEM_MESSAGE
    packet.text = message
    if (color !== '')
        packet.color = color
    return JSON.stringify(packet)
}

my.InformMessage = function (message) {
    const packet = {}
    packet._head = ToClient.INFORM_MESSAGE
    packet.text = message
    return JSON.stringify(packet)
}

my.NoticeMessage = function (message) {
    const packet = {}
    packet._head = ToClient.NOTICE_MESSAGE
    packet.text = message
    return JSON.stringify(packet)
}

my.ComboMessage = function (message) {
    const packet = {}
    packet._head = ToClient.COMBO_MESSAGE
    packet.text = message
    return JSON.stringify(packet)
}

my.ChatMessage = function (type, index, name, text, color = '') {
    const packet = {}
    packet._head = ToClient.CHAT_MESSAGE
    packet.type = type
    packet.index = index
    packet.name = name
    packet.text = text
    if (color !== '')
        packet.color = color
    return JSON.stringify(packet)
}

my.Portal = function (place, x, y, dir) {
    const packet = {}
    packet._head = ToClient.PORTAL
    packet.place = place
    packet.x = x
    packet.y = y
    packet.dir = dir
    return JSON.stringify(packet)
}

my.RemoveGameObject = function (obj) {
    const packet = {}
    packet._head = ToClient.REMOVE_GAME_OBJECT
    packet.type = obj.type
    packet.index = obj.index;
    return JSON.stringify(packet)
}

my.CreateGameObject = function (obj, hide = false, anony = false) {
    const packet = {}
    packet._head = ToClient.CREATE_GAME_OBJECT
    packet.index = obj.index
    packet.pick = obj.pick || 0
    packet.clanname = hide ? '' : (anony ? '' : (obj.clan && obj.clan.name || ''))
    packet.type = obj.type
    packet.name = hide ? '' : (anony ? obj.pick + '번' : obj.name)
    packet.team = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('team')) ? obj.game.team : TeamType.BLUE
    packet.level = hide ? 0 : (obj.level || 0)
    packet.graphics = obj.graphics
    packet.x = obj.x
    packet.y = obj.y
    packet.dir = obj.direction
    packet.collider = obj.collider
    return JSON.stringify(packet)
}

my.SetGraphics = function (obj) {
    const packet = {}
    packet._head = ToClient.SET_GRAPHICS
    packet.type = obj.type
    packet.index = obj.index
    packet.graphics = obj.graphics
    return JSON.stringify(packet)
}

my.PlaySound = function (type, name) {
    const packet = {}
    packet._head = ToClient.PLAY_SOUND
    packet.type = type
    packet.name = name
    return JSON.stringify(packet)
}

my.UpdateRoomUserCount = function (count) {
    const packet = {}
    packet._head = ToClient.UPDATE_ROOM_USER_COUNT
    packet.count = count
    return JSON.stringify(packet)
}

my.UpdateModeInfo = function (index, mode) {
    const packet = {}
    packet._head = ToClient.UPDATE_MODE_INFO
    packet.index = parseInt(index)
    packet.days = mode.days
    packet.isNight = mode.state === 2
    return JSON.stringify(packet)
}

my.UpdateModeRedAndBlue = function (red, blue) {
    const packet = {}
    packet._head = ToClient.UPDATE_MODE_COUNT
    packet.red = red
    packet.blue = blue
    return JSON.stringify(packet)
}

my.UpdateGameItem = function (name, num) {
    const packet = {}
    packet._head = ToClient.UPDATE_GAME_ITEM
    packet.name = name
    packet.num = num
    return JSON.stringify(packet)
}

my.RemoveGameItem = function () {
    const packet = {}
    packet._head = ToClient.REMOVE_GAME_ITEM
    return JSON.stringify(packet)
}

my.SetGameTeam = function (obj) {
    const packet = {}
    packet._head = ToClient.SET_GAME_TEAM
    packet.type = obj.type
    packet.index = obj.index
    packet.team = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('team')) ? obj.game.team : TeamType.BLUE
    return JSON.stringify(packet)
}

my.ModeData = function (mode) {
    const packet = {}
    packet._head = ToClient.MODE_DATA
    packet.mode = mode.mode
    packet.count = mode.count
    packet.maxCount = mode.maxCount
    return JSON.stringify(packet)
}

my.GetClan = function (clan, members = []) {
    const packet = {}
    packet._head = ToClient.GET_CLAN
    packet.hasClan = !!clan
    if (packet.hasClan) {
        packet.name = clan.name
        packet.level = clan.level
        packet.level1_name = clan.level1_name
        packet.level2_name = clan.level2_name
        packet.level3_name = clan.level3_name
        packet.level4_name = clan.level4_name
        packet.level5_name = clan.level5_name
        packet.notice = clan.notice
        packet.level = clan.level
        packet.exp = clan.exp
        packet.cash = clan.cash
        packet.coin = clan.coin
        packet.regdate = clan.regdate
        packet.condition = clan.condition
        packet.masterId = clan.masterId
        packet.members = members.map(m => ({
            id: m.id,
            avatar: m.avatar,
            level: m.level,
            name: m.name,
            clanLevel: m.clanLevel,
            clanExp: m.clanExp,
            clanCoin: m.clanCoin,
            updated: m.updated,
            clanRegdate: m.clanRegdate
        }))
    }
    return JSON.stringify(packet)
}

my.InviteClan = function (invites) {
    const packet = {}
    packet._head = ToClient.INVITE_CLAN
    packet.invites = invites
    return JSON.stringify(packet)
}

my.MemberInfoClan = function (memberId) {
    const packet = {}
    packet._head = ToClient.MEMBER_INFO_CLAN
    packet.id = memberId
    return JSON.stringify(packet)
}

my.UpdateClan = function (clan) {
    const packet = {}
    packet._head = ToClient.UPDATE_CLAN
    packet.level = clan.level
    packet.cash = clan.cash
    packet.coin = clan.coin
    return JSON.stringify(packet)
}

my.MessageClan = function (status) {
    const packet = {}
    packet._head = ToClient.MESSAGE_CLAN
    packet.status = status
    return JSON.stringify(packet)
}

my.DeadAnimation = function () {
    const packet = {}
    packet._head = ToClient.DEAD_ANIMATION
    return JSON.stringify(packet)
}

my.ResultGame = function (type, winner, users, hide = false) {
    const packet = {}
    packet._head = ToClient.RESULT_GAME
    packet.type = type
    packet.winner = winner
    packet.users = users.map(u => ({
        index: u.index,
        pick: u.pick,
        name: hide ? u.pick + '번' : u.name,
        clanname: hide ? '' : (u.clanname || ''),
        //score: (u.hasOwnProperty('score') && u.score.hasOwnProperty('sum')) ? u.score.sum : 0,
        job: (u.hasOwnProperty('game') && u.game.hasOwnProperty('job')) ? u.game.job : 0
    }))
    return JSON.stringify(packet)
}

my.EnterWardrobe = function () {
    const packet = {}
    packet._head = ToClient.ENTER_WARDROBE
    return JSON.stringify(packet)
}

my.LeaveWardrobe = function () {
    const packet = {}
    packet._head = ToClient.LEAVE_WARDROBE
    return JSON.stringify(packet)
}

my.SwitchLight = function (active) {
    const packet = {}
    packet._head = ToClient.SWITCH_LIGHT
    packet.active = active
    return JSON.stringify(packet)
}

my.ToggleHit = function (active) {
    const packet = {}
    packet._head = ToClient.TOGGLE_HIT
    packet.active = active
    return JSON.stringify(packet)
}

my.ToggleTime = function (active) {
    const packet = {}
    packet._head = ToClient.TOGGLE_TIME
    packet.active = active
    return JSON.stringify(packet)
}

my.QuitGame = function () {
    const packet = {}
    packet._head = ToClient.QUIT_GAME
    return JSON.stringify(packet)
}

my.GetBilling = function (items = []) {
    const packet = {}
    packet._head = ToClient.GET_BILLING
    packet.items = items.map(i => ({
        id: i.id,
        cash: i.productId,
        regdate: moment(i.purchaseDate, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss'),
        use: i.useState,
        refund: i.refundRequestState
    }))
    return JSON.stringify(packet)
}

my.UpdateBilling = function (id, useState, refundRequestState) {
    const packet = {}
    packet._head = ToClient.UPDATE_BILLING
    packet.id = id
    packet.use = useState
    packet.refund = refundRequestState
    return JSON.stringify(packet)
}

my.GetPayInfoItem = function (item) {
    const packet = {}
    packet._head = ToClient.GET_PAY_INFO_ITEM
    packet.id = item.id
    packet.cash = item.productId
    packet.memo = item.transactionId // item.memo
    packet.regdate = moment(item.purchaseDate, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss')
    packet.use = item.useState
    packet.refund = item.refundRequestState
    return JSON.stringify(packet)
}

my.GetShop = function (items = []) {
    const packet = {}
    packet._head = ToClient.GET_SHOP
    packet.items = items.map(i => ({
        id: i.id,
        type: i.type,
        icon: i.icon,
        name: i.name,
        description: i.description,
        cost: i.cost,
        isCash: i.isCash
    }))
    return JSON.stringify(packet)
}

my.GetSkinItem = function (item, expiry) {
    const packet = {}
    packet._head = ToClient.GET_SKIN_ITEM
    packet.id = item.id
    packet.type = item.type
    packet.icon = item.icon
    packet.name = item.name
    packet.creator = item.creator || ''
    packet.description = item.description
    packet.cost = item.cost
    packet.isCash = item.isCash
    packet.expiry = expiry
    return JSON.stringify(packet)
}

my.MessageShop = function (status) {
    const packet = {}
    packet._head = ToClient.MESSAGE_SHOP
    packet.status = status
    return JSON.stringify(packet)
}

my.MessageLobby = function (status) {
    const packet = {}
    packet._head = ToClient.MESSAGE_LOBBY
    packet.status = status
    return JSON.stringify(packet)
}

my.GetSkinList = function (skins = []) {
    const packet = {}
    packet._head = ToClient.GET_SKIN_LIST
    packet.skins = skins.map(s => ({
        id: s.id,
        icon: s.icon,
        name: s.name,
        expiry: s.expiry
    }))
    return JSON.stringify(packet)
}

my.UpdateCashAndCoin = function (cash, coin) {
    const packet = {}
    packet._head = ToClient.UPDATE_CASH_AND_COIN
    packet.cash = cash
    packet.coin = coin
    return JSON.stringify(packet)
}

my.GetRank = function (ranks = []) {
    const packet = {}
    packet._head = ToClient.GET_RANK
    packet.ranks = ranks.map(r => ({
        id: r.id,
        rank: r.rank,
        name: r.name,
        clanname: r.clanname || '(소속 없음)',
        level: r.level,
        exp: r.exp,
        point: r.point,
        win: r.win,
        lose: r.lose,
        escape: r.escape,
        rankWin: r.rankWin,
        rankLose: r.rankLose,
        rankEscape: r.rankEscape,
        avatar: r.avatar
    }))
    return JSON.stringify(packet)
}

my.GetUserInfoRank = function (user, maxExp) {
    const packet = {}
    packet._head = ToClient.GET_USER_INFO_RANK
    packet.rank = user.rank
    packet.name = user.name
    packet.clanname = user.clanname || '(소속 없음)'
    packet.level = user.level
    packet.exp = user.exp
    packet.maxExp = maxExp
    packet.win = user.win
    packet.lose = user.lose
    packet.escape = user.escape
    packet.rankWin = user.rankWin
    packet.rankLose = user.rankLose
    packet.rankEscape = user.rankEscape
    packet.likes = user.likes
    packet.memo = user.memo
    packet.avatar = user.avatar
    return JSON.stringify(packet)
}

my.MessageRank = function (status) {
    const packet = {}
    packet._head = ToClient.MESSAGE_RANK
    packet.status = status
    return JSON.stringify(packet)
}

my.GetNoticeMessageCount = function (count) {
    const packet = {}
    packet._head = ToClient.GET_NOTICE_MESSAGE_COUNT
    packet.count = count
    return JSON.stringify(packet)
}

my.GetNoticeMessage = function (items = []) {
    const packet = {}
    packet._head = ToClient.GET_NOTICE_MESSAGE
    packet.items = items.map(i => ({
        id: i.id,
        avatar: i.avatar,
        author: i.author,
        title: i.title,
        created: moment(i.created, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss'),
        deleted: i.deleted ? true : false
    }))
    return JSON.stringify(packet)
}

my.GetInfoNoticeMessage = function (item) {
    const packet = {}
    packet._head = ToClient.GET_INFO_NOTICE_MESSAGE
    packet.id = item.id
    packet.avatar = item.avatar
    packet.author = item.author
    packet.title = item.title
    packet.content = item.content
    packet.cash = item.cash
    packet.coin = item.coin
    packet.created = moment(item.created, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss')
    packet.deleted = item.deleted ? true : false
    packet.rewarded = item.rewarded
    return JSON.stringify(packet)
}

my.DeleteNoticeMessage = function (id) {
    const packet = {}
    packet._head = ToClient.DELETE_NOTICE_MESSAGE
    packet.id = id
    return JSON.stringify(packet)
}

my.MessageGame = function (status) {
    const packet = {}
    packet._head = ToClient.MESSAGE_GAME
    packet.status = status
    return JSON.stringify(packet)
}

my.SetAnimation = function (obj, anim, sound = null) {
    const packet = {}
    packet._head = ToClient.SET_ANIMATION
    packet.type = obj.type
    packet.index = obj.index
    packet.anim = anim
    if (sound)
        packet.sound = sound
    return JSON.stringify(packet)
}

my.GetRoomInfo = function (room, pick = 0) {
    const packet = {}
    packet._head = ToClient.GET_ROOM_INFO
    packet.index = room.index
    packet.pick = pick
    packet.type = room.type
    packet.name = room.name
    packet.max = room.max
    packet.rank = room.type === RoomType.RANK_GAME
    packet.voice = room.voice
    return JSON.stringify(packet)
}

my.GetVote = function (users = [], hide = false) {
    const packet = {}
    packet._head = ToClient.GET_VOTE
    packet.users = users.map(i => ({
        index: i.index,
        name: hide ? i.pick + '번' : i.pick + '. ' + i.name
    }))
    return JSON.stringify(packet)
}

my.SetUpVote = function (user) {
    const packet = {}
    packet._head = ToClient.SET_UP_VOTE
    packet.index = user.index
    packet.count = (user.hasOwnProperty('game') && user.game.hasOwnProperty('count')) ? user.game.count : 0
    return JSON.stringify(packet)
}

my.CloseVote = function () {
    const packet = {}
    packet._head = ToClient.CLOSE_VOTE
    return JSON.stringify(packet)
}

my.SetMuteVoiceChat = function (user, mute = false) {
    const packet = {}
    packet._head = ToClient.SET_MUTE_VOICE_CHAT
    packet.index = user.index
    packet.roomId = user.roomId
    packet.mute = mute
    return JSON.stringify(packet)
}

my.GetUserJobMemo = function (users = [], hide = false) {
    const packet = {}
    packet._head = ToClient.GET_USER_JOB_MEMO
    packet.users = users.map(u => ({
        index: u.index,
        pick: u.pick,
        name: hide ? (u.pick + '번') : u.name,
        dead: (u.hasOwnProperty('game') && u.game.hasOwnProperty('dead')) ? u.game.dead : false
    }))
    return JSON.stringify(packet)
}

my.SetUpUserJobMemo = function (user, hide = false) {
    const packet = {}
    packet._head = ToClient.SET_UP_USER_JOB_MEMO
    packet.index = user.index
    packet.pick = user.pick
    packet.name = hide ? (user.pick + '번') : user.name
    packet.dead = (user.hasOwnProperty('game') && user.game.hasOwnProperty('dead')) ? user.game.dead : false
    return JSON.stringify(packet)
}

my.RemoveUserJobMemo = function (pick) {
    const packet = {}
    packet._head = ToClient.REMOVE_USER_JOB_MEMO
    packet.pick = pick
    return
}

module.exports = {
    ...my
}