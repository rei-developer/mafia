const Serialize = require('./protocol/Serialize')
const Character = require('./Character')
const { TeamType, RoomType } = require('./util/const')
const PlayerState = require('./PlayerState')
const DB = require('./DB')
const Data = require('./Data')
const Score = require('./Score')
const Reward = require('./Reward')
const filtering = require('./util/filtering-text')
const pix = require('./util/pix')
const moment = require('moment')

global.User = (function () {
    const _static = {
        users: [],
        index: 0
    }
    return class User extends Character {
        constructor(socket, verify, admin = 1) {
            super()
            this.type = 1
            this.index = 0
            this.pick = 0
            this.socket = socket
            this.verify = verify
            this.roomId = 0
            this.place = 1
            this.game = {}
            this.score = new Score()
            this.reward = new Reward()
            this.state = PlayerState.Basic
            this.id = 0
            this.rank = 0
            this.name = '테스트'
            this.pureName = this.name
            this.level = 1
            this.exp = 0
            this.maxExp = this.getMaxExp()
            this.coin = 0
            this.cash = 0
            this.point = 0
            this.win = 0
            this.lose = 0
            this.escape = 0
            this.rankWin = 0
            this.rankLose = 0
            this.rankEscape = 0
            this.graphics = 'KJT'
            this.pureGraphics = this.graphics
            this.deadGraphics = 'Cat'
            this.memo = ''
            this.lastChatTime = new Date()
            this.alert = 0
            this.admin = admin
            this.timestamp = 0
            this.inventory = []
            this.clan = null
            return (async () => {
                if (verify === 'test')
                    this.verify = { id: 1, loginType: 0 }
                await this.loadUserData()
                return this
            })()
        }

        setUpLevel(value = 1) {
            this.level += value
            this.maxExp = this.getMaxExp()
        }

        setUpExp(value) {
            if (this.level > 200)
                return
            this.exp = Math.max(this.exp + value, 0)
            while (this.exp >= this.maxExp) {
                this.exp -= this.maxExp
                this.setUpLevel()
            }
        }

        async setUpCash(cash) {
            this.cash += cash
            await DB.UpdateUserCash(this.id, this.cash)
        }

        getMaxExp(level = this.level) {
            return (Math.pow(level, 2) * (level * 5)) + 200
        }

        static get users() {
            return _static.users
        }

        static get index() {
            return _static.index
        }

        static set index(value) {
            _static.index = value
        }

        static getByUser(user) {
            return User.users.find(u => u === user)
        }

        static getByUserIndex(index) {
            return User.users.find(u => u.index === index)
        }

        static async create(socket, verify) {
            if (User.users.some((u) => u.verify.id === verify.id && u.verify.loginType === verify.loginType))
                return
            if (verify === 'test') {
                const user = await new User(socket, verify, 1)
                User.add(user)
                return user
            }
            const user = await new User(socket, verify)
            User.add(user)
            return user
        }

        static add(user) {
            user.index = ++User.index
            User.users.push(user)
        }

        static removeByUser(user) {
            User.users.splice(User.users.indexOf(user), 1)
        }

        static removeByIndex(index) {
            User.users.splice(index, 1)
        }

        async loadUserData() {
            const user = await DB.FindUserByOauth(this.verify.id, this.verify.loginType)
            if (!user || !user.name)
                throw new Error('존재하지 않는 계정입니다. : ' + user)
            const inventory = await DB.LoadInventorys(user.id)
            if (inventory) {
                this.inventory = inventory.map(i => ({
                    id: i.item_id,
                    num: i.num,
                    expiry: i.expiry
                }))
            }
            const clanMember = await DB.FindMyClanByUserId(user.id)
            if (clanMember)
                this.clan = Clan.clans[clanMember.clan_id]
            this.id = user.id
            const rank = Data.rank.find(r => r.id === this.id)
            this.rank = rank ? rank.rank : 0
            this.name = user.name
            this.pureName = user.name
            this.level = user.level
            this.exp = user.exp
            this.maxExp = this.getMaxExp()
            this.coin = user.coin
            this.cash = user.cash
            this.point = user.point
            this.win = user.win
            this.lose = user.lose
            this.escape = user.escape
            this.rankWin = user.rankWin
            this.rankLose = user.rankLose
            this.rankEscape = user.rankEscape
            this.graphics = user.pure_graphics
            this.pureGraphics = user.pure_graphics
            this.deadGraphics = user.dead_graphics
            this.memo = user.memo
            this.lastChatTime = new Date(user.last_chat)
            this.admin = user.admin
        }

        async changeUsername(username) {
            if (this.cash < 500)
                return this.send(Serialize.MessageLobby('NOT_ENOUGH_CASH'))
            if (username.length < 1 || username.length > 6)
                return this.send(Serialize.MessageLobby('AN_IMPOSSIBLE_LENGTH'))
            if (/[^가-힣]/.test(username))
                return this.send(Serialize.MessageLobby('AN_IMPOSSIBLE_WORD'))
            if (!filtering.check(username))
                return this.send(Serialize.MessageLobby('UNAVAILABLE_NAME'))
            if (await DB.FindUserByName(username))
                return this.send(Serialize.MessageLobby('ALREADY_EXISTENT_USER'))
            if (!await DB.UpdateUsername(this.id, username))
                return this.send(Serialize.MessageLobby('FAILED'))
            const user = Data.rank.find(r => r.id === this.id)
            if (user)
                user.name = username
            this.name = username
            this.pureName = username
            this.setUpCash(-500)
            this.send(Serialize.MessageLobby('CHANGE_USERNAME_SUCCESS'))
            this.send(Serialize.UserData(this))
        }

        async createClan(name) {
            if (this.clanId)
                return
            if (this.coin < 2000)
                return this.send(Serialize.MessageClan('NOT_ENOUGH_COIN'))
            if (name.length < 1 || name.length > 12)
                return this.send(Serialize.MessageClan('AN_IMPOSSIBLE_LENGTH'))
            if (name.match(/[^가-힣a-zA-Z0-9]+/))
                return this.send(Serialize.MessageClan('AN_IMPOSSIBLE_WORD'))
            if (!filtering.check(name))
                return this.send(Serialize.MessageClan('FILTERING'))
            const clan = await Clan.create(this.id, name)
            if (!clan)
                return
            this.coin -= 2000
            this.clan = clan
            let members = []
            for (let i = 0; i < this.clan.members.length; ++i) {
                const memberId = this.clan.members[i]
                members.push(await DB.FindUserClanInfoById(memberId))
            }
            members = await Promise.all(members)
            this.send(Serialize.GetClan(this.clan, members))
        }

        async inviteClan(name) {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 3)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            const memberCount = this.clan.members.length
            if (memberCount >= 50)
                return this.send(Serialize.MessageClan('FULL_MEMBER'))
            if (memberCount >= this.clan.level * 10)
                return this.send(Serialize.MessageClan('LOW_LEVEL'))
            this.clan.invite(this, name)
        }

        async joinClan(id) {
            if (this.clan)
                return
            if (await Clan.get(id).enter(this.id)) {
                this.clan = Clan.get(id)
                this.getClan()
            }
        }

        async cancelClan(id) {
            await DB.DeleteInviteClan(id)
        }

        async kickClan(id) {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 4)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            if (this.clan.masterId == id)
                return this.send(Serialize.MessageClan('AN_INIMITABLE_MEMBER'))
            this.clan.leave(id)
            const findUser = User.users.find(u => u.id === id)
            if (findUser)
                findUser.clan = null
            this.getClan()
        }

        async getClan() {
            if (!this.clan) {
                this.send(Serialize.GetClan())
                const invites = await DB.LoadInviteClans(this.id)
                this.send(Serialize.InviteClan(invites.map(i => ({
                    id: i.clan_id,
                    name: Clan.get(i.clan_id).name,
                }))))
                return
            }
            let members = []
            for (let i = 0; i < this.clan.members.length; ++i) {
                const memberId = this.clan.members[i]
                members.push(await DB.FindUserClanInfoById(memberId))
            }
            members = await Promise.all(members)
            this.send(Serialize.GetClan(this.clan, members))
        }

        async leaveClan() {
            if (!this.clan)
                return
            if (this.clan.masterId === this.id) {
                if (this.clan.members.length > 1)
                    return this.send(Serialize.MessageClan('MEMBER_STILL_EXISTS'))
                this.coin += this.clan.coin
            }
            this.clan.leave(this.id)
            this.clan = null
            this.send(Serialize.GetClan())
        }

        async setOptionClan(data) {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 4)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            data.notice = data.notice.replace(/<br>/g, '\n')
            this.clan.setOption(data)
            this.getClan()
        }

        async payClan(data) {
            if (!this.clan)
                return
            data = Number(data)
            if (isNaN(data))
                return this.send(Serialize.MessageClan('WRONG_NUMBER'))
            if (data < 1)
                return this.send(Serialize.MessageClan('BELOW_STANDARD'))
            if (this.coin < data)
                return this.send(Serialize.MessageClan('NOT_ENOUGH_COIN'))
            this.clan.setUpCoin(data)
            this.coin -= data
            this.send(Serialize.UpdateClan(this.clan))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
        }

        async donateClan(cash) {
            if (!this.clan)
                return
            cash = Number(cash)
            if (isNaN(cash))
                return this.send(Serialize.MessageClan('WRONG_NUMBER'))
            if (cash < 1)
                return this.send(Serialize.MessageClan('BELOW_STANDARD'))
            if (this.cash < cash)
                return this.send(Serialize.MessageClan('NOT_ENOUGH_CASH'))
            this.clan.setUpCash(cash)
            this.setUpCash(-cash)
            this.send(Serialize.UpdateClan(this.clan))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
        }

        async withdrawClan(data) {
            if (!this.clan)
                return
            if (this.clan.masterId !== this.id)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            data = Number(data)
            if (isNaN(data))
                return this.send(Serialize.MessageClan('WRONG_NUMBER'))
            if (data < 1)
                return this.send(Serialize.MessageClan('BELOW_STANDARD'))
            if (this.clan.coin < data)
                return this.send(Serialize.MessageClan('NOT_ENOUGH_CLAN_COIN'))
            this.clan.setUpCoin(-data)
            this.coin += data
            this.send(Serialize.UpdateClan(this.clan))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
        }

        async levelUpClan() {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 4)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            if (this.clan.level >= 5)
                return this.send(Serialize.MessageClan('HIGH_LEVEL'))
            const cost = (this.clan.level * this.clan.level) * 100000
            if (this.clan.coin < cost)
                return this.send(Serialize.MessageClan('NOT_ENOUGH_CLAN_COIN'))
            this.clan.setUpCoin(-cost)
            this.clan.setUpLevel()
        }

        async setUpMemberLevelClan(data) {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 4)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            if (this.id === data)
                return this.send(Serialize.MessageClan('OWN_SELF'))
            if (this.clan.masterId === data)
                return this.send(Serialize.MessageClan('AN_INIMITABLE_MEMBER'))
            const targetMember = await DB.FindUserClanInfoById(data)
            if (!targetMember)
                return
            if (targetMember.clanLevel >= 4)
                return this.send(Serialize.MessageClan('LEVEL_LIMIT'))
            this.clan.setMemberLevel(data, targetMember.clanLevel + 1)
            this.getClan()
        }

        async setDownMemberLevelClan(data) {
            if (!this.clan)
                return
            const member = await DB.FindUserClanInfoById(this.id)
            if (!member)
                return
            if (member.clanLevel < 4)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            if (this.id === data)
                return this.send(Serialize.MessageClan('OWN_SELF'))
            if (this.clan.masterId === data)
                return this.send(Serialize.MessageClan('AN_INIMITABLE_MEMBER'))
            const targetMember = await DB.FindUserClanInfoById(data)
            if (!targetMember)
                return
            if (member.clanLevel === targetMember.clanLevel)
                return this.send(Serialize.MessageClan('SAME_LEVEL_AS_ME'))
            if (targetMember.clanLevel <= 1)
                return this.send(Serialize.MessageClan('LEVEL_LIMIT'))
            this.clan.setMemberLevel(data, targetMember.clanLevel - 1)
            this.getClan()
        }

        async changeMasterClan(data) {
            if (!this.clan)
                return
            if (this.clan.masterId !== this.id)
                return this.send(Serialize.MessageClan('NO_PERMISSIONS'))
            if (this.id === data)
                return this.send(Serialize.MessageClan('OWN_SELF'))
            this.clan.changeMaster(this, data)
            this.getClan()
        }

        async tempSkinBuy() {
            if (this.coin < 5000)
                return
            const skins = [
                'base',
                'Bbangdori',
                //'catman',
                'Loliny',
                'Mania',
                'orange',
                'Prisoner',
                'Red_Witch',
                'Someok',
                //'Yuzuha',
                //'YuzuhaBlue'
            ]
            const i = Math.floor(Math.random() * skins.length)
            this.pureGraphics = skins[i]
            this.coin -= 5000
            this.send(Serialize.TempSkinBuy(this.pureGraphics, this.coin))
        }

        async getBilling() {
            const items = await DB.LoadBilling(this.id)
            this.send(Serialize.GetBilling(items))
        }

        async getPayInfoItem(id) {
            const item = await DB.FindBilling(id, this.id)
            if (!item)
                return
            this.send(Serialize.GetPayInfoItem(item))
        }

        async useBilling(id) {
            const item = await DB.FindBilling(id, this.id)
            if (!item)
                return
            if (item.useState > 0)
                return this.send(Serialize.MessageShop('ALREADY_USED'))
            if (item.refundRequestState === 1)
                return this.send(Serialize.MessageShop('ALREADY_REQUESTED_REFUND'))
            if (item.refundRequestState === 2)
                return this.send(Serialize.MessageShop('ALREADY_REFUNDED'))
            if (item.allowState < 1)
                return this.send(Serialize.MessageShop('NOT_ALLOWED'))
            if (!await DB.UpdateBillingUseState(id, this.id))
                return this.send(Serialize.MessageShop('FAILED'))
            const cash = Number(item.productId)
            this.setUpCash(cash)
            this.send(Serialize.UpdateBilling(id, 1, 0))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
            this.send(Serialize.MessageShop('USE_SUCCESS'))
        }

        async refundBilling(id) {
            const item = await DB.FindBilling(id, this.id)
            if (!item)
                return
            if (item.useState > 0)
                return this.send(Serialize.MessageShop('ALREADY_USED'))
            if (item.refundRequestState === 1)
                return this.send(Serialize.MessageShop('ALREADY_REQUESTED_REFUND'))
            if (item.refundRequestState === 2)
                return this.send(Serialize.MessageShop('ALREADY_REFUNDED'))
            if (item.allowState < 1)
                return this.send(Serialize.MessageShop('NOT_ALLOWED'))
            const days = moment().diff(moment(item.purchaseDate), 'days')
            if (days >= 7)
                return this.send(Serialize.MessageShop('NON_REFUNDABLE'))
            if (!await DB.UpdateBillingRefundRequestState(id, this.id, 1))
                return this.send(Serialize.MessageShop('FAILED'))
            this.send(Serialize.UpdateBilling(id, 0, 1))
            this.send(Serialize.MessageShop('REQUEST_REFUND_SUCCESS'))
        }

        getShop(page) {
            const GET_COUNT = 15
            let items = []
            for (let i = ((page - 1) * GET_COUNT) + 1; i <= ((page - 1) * GET_COUNT) + GET_COUNT; ++i) {
                const item = Shop.get(i)
                if (item)
                    items.push(item)
            }
            this.send(Serialize.GetShop(items))
        }

        getInfoItem(id) {
            const item = Shop.get(id)
            if (!item)
                return
            if (item.type === 'SKIN' || item.type === 'DEAD_SKIN') {
                const check = this.inventory.find(i => i.id === id)
                this.send(Serialize.GetSkinItem(item, check ? moment(check.expiry, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') : '-'))
            }
        }

        async buyItem(data) {
            const item = Shop.get(data.id)
            if (!item)
                return
            if (item.type === 'ITEM') {
                if (item.isCash) {
                    if (this.cash < item.cost * data.num)
                        return this.send(Serialize.MessageShop('NOT_ENOUGH_CASH'))
                    this.setUpCash(-(item.cost * data.num))
                } else {
                    if (this.coin < item.cost * data.num)
                        return this.send(Serialize.MessageShop('NOT_ENOUGH_COIN'))
                    this.coin -= item.cost * data.num
                }
                this.addItem(data.id, data.num)
                this.send(Serialize.MessageShop('BUY_SUCCESS'))
                this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
            } else if (item.type === 'SKIN' || item.type === 'DEAD_SKIN') {
                if (item.isCash) {
                    if (this.cash < item.cost * data.days)
                        return this.send(Serialize.MessageShop('NOT_ENOUGH_CASH'))
                    this.setUpCash(-(item.cost * data.days))
                    /*if (item.creatorId > 0 && this.id !== item.creatorId) {
                        const receiveCash = Math.floor(item.cost / 10)
                        const title = item.name + ' 스킨 구매에 따른 보석 지급 안내'
                        const content = '안녕하세요?<br><br>스킨 공모에 출품하신 <color=red>[' + item.name + ']</color>' + (pix.maker(item.name) ? '를' : '을') + ' <color=red>[' + this.name + ']</color>님께서 구입하셨기 때문에 보석 "' + receiveCash + '개"를 지급해드립니다.<br><br>앞으로도 많은 출품을 부탁드립니다. 감사합니다!'
                        await DB.InsertNoticeMessage(item.creatorId, this.id, title, content, receiveCash)
                    }*/
                } else {
                    if (this.coin < item.cost * data.days)
                        return this.send(Serialize.MessageShop('NOT_ENOUGH_COIN'))
                    this.coin -= item.cost * data.days
                }
                const check = this.inventory.find(i => i.id === data.id)
                let date
                if (check) {
                    const min = moment().diff(moment(check.expiry), 'minutes')
                    date = moment(min > 0 ? new Date() : check.expiry, 'YYYY-MM-DD HH:mm:ss').add(data.days, 'days').format('YYYY-MM-DD HH:mm:ss')
                    check.expiry = date
                    this.send(Serialize.MessageShop('UPDATE_SUCCESS'))
                } else {
                    date = moment(new Date(), 'YYYY-MM-DD HH:mm:ss').add(data.days, 'days').format('YYYY-MM-DD HH:mm:ss')
                    this.addItem(data.id, 1, date)
                    this.send(Serialize.MessageShop('BUY_SUCCESS'))
                }
                if (item.type === 'SKIN')
                    this.pureGraphics = item.icon
                else if (item.type === 'DEAD_SKIN')
                    this.deadGraphics = item.icon
                this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
            }
        }

        addItem(id, num, expiry = null) {
            this.inventory.push({ id, num, expiry })
        }

        checkSkinExpiry() {
            this.inventory.map(i => {
                const item = Shop.get(i.id)
                if (!item)
                    return
                if (item.type === 'SKIN' && item.icon === this.pureGraphics) {
                    const min = moment().diff(moment(i.expiry), 'minutes')
                    if (min > 0)
                        this.pureGraphics = 'KJT'
                }
                if (item.type === 'DEAD_SKIN' && item.icon === this.deadGraphics) {
                    const min = moment().diff(moment(i.expiry), 'minutes')
                    if (min > 0)
                        this.deadGraphics = 'Cat'
                }
            })
        }

        getSkinList() {
            let skins = []
            this.inventory.map(i => {
                const item = Shop.get(i.id)
                if (!item)
                    return
                if (item.type === 'SKIN' || item.type === 'DEAD_SKIN') {
                    const min = moment().diff(moment(i.expiry), 'minutes')
                    if (min < 0) {
                        skins.push({
                            id: i.id,
                            icon: item.icon,
                            name: item.name,
                            expiry: moment(i.expiry, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
                        })
                    }
                }
            })
            this.send(Serialize.GetSkinList(skins))
        }

        getRank(page) {
            const GET_COUNT = 15
            let ranks = []
            for (let i = 0; i < Data.rank.length; ++i)
                ranks.push(Data.rank[i])
            this.send(Serialize.GetRank(ranks.splice((page - 1) * GET_COUNT, GET_COUNT)))
        }

        getUserInfoRank(id) {
            const user = Data.rank.find(r => r.id === id)
            this.send(Serialize.GetUserInfoRank(user, this.getMaxExp(user.level)))
        }

        getUserInfoRankByUsername(username) {
            const user = Data.rank.find(r => r.name === username)
            if (!user)
                return this.send(Serialize.MessageRank('NON_EXISTENT_USER'))
            this.send(Serialize.GetUserInfoRank(user, this.getMaxExp(user.level)))
        }

        async getNoticeMessageCount() {
            const count = await DB.GetNoticeMessageCount(this.id)
            this.send(Serialize.GetNoticeMessageCount(count ? count[0].count : 0))
        }

        async getNoticeMessage(deleted) {
            const item = await DB.LoadNoticeMessage(this.id, deleted)
            if (!item)
                return
            this.send(Serialize.GetNoticeMessage(item))
        }

        async getInfoNoticeMessage(id) {
            const item = await DB.GetNoticeMessage(id)
            if (!item)
                return
            this.send(Serialize.GetInfoNoticeMessage(item))
        }

        async withdrawNoticeMessage(id) {
            const item = await DB.GetNoticeMessage(id)
            if (!item)
                return
            if (item.cash < 1 || item.rewarded > 0)
                return
            if (!await DB.UpdateNotieMessageRewarded(id))
                return this.send(Serialize.MessageLobby('FAILED'))
            this.setUpCash(item.cash)
            this.coin += item.coin
            this.send(Serialize.MessageLobby('WITHDRAW_SUCCESS'))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
        }

        async deleteNoticeMessage(id) {
            const item = await DB.GetNoticeMessage(id)
            if (!item)
                return
            if (item.deleted) {
                if (!await DB.DeleteNoticeMessage(id, this.id))
                    return this.send(Serialize.MessageLobby('FAILED'))
            } else {
                if (!await DB.UpdateNotieMessageDeleted(id, this.id))
                    return this.send(Serialize.MessageLobby('FAILED'))
            }
            this.send(Serialize.DeleteNoticeMessage(id))
            await this.getNoticeMessageCount()
        }

        async restoreNoticeMessage(id) {
            const item = await DB.GetNoticeMessage(id)
            if (!item || !item.deleted)
                return
            if (!await DB.UpdateNotieMessageDeleted(id, this.id, false))
                return this.send(Serialize.MessageLobby('FAILED'))
            this.send(Serialize.DeleteNoticeMessage(id))
            await this.getNoticeMessageCount()
        }

        async clearNoticeMessage() {
            if (await DB.ClearNoticeMessage(this.id))
                this.send(Serialize.MessageLobby('CLEAR_NOTICE_SUCCESS'))
        }

        async addNoticeMessage(data) {
            if (this.cash < 10)
                return
            const { username, title, content } = data
            if (username === '' || title === '' || content === '')
                return
            const target = await DB.FindUserByName(username)
            if (!target || !target.id)
                return this.send(Serialize.MessageLobby('NON_EXISTENT_USER'))
            if (!await DB.InsertNoticeMessage(target.id, this.id, title, content))
                return this.send(Serialize.MessageLobby('FAILED'))
            this.setUpCash(-10)
            this.send(Serialize.MessageLobby('ADD_NOTICE_SUCCESS'))
            this.send(Serialize.UpdateCashAndCoin(this.cash, this.coin))
        }

        async addUserReport(data) {
            const { type, username, content } = data
            if (username === '' || content === '')
                return
            const target = await DB.FindUserByName(username)
            if (!target || !target.id)
                return this.send(Serialize.MessageGame('NON_EXISTENT_USER'))
            const check = await DB.FindReportedUser(this.id, target.id)
            if (check)
                return this.send(Serialize.MessageGame('ALREADY_RECEIVED'))
            if (await DB.InsertReport(this.id, target.id, type, content))
                this.send(Serialize.MessageGame('REQUEST_REPORT_SUCCESS'))
        }

        setTarget() {
            if (!this.roomId)
                return
            Room.get(this.roomId).setTarget(this)
        }

        setGameTime(active) {
            if (!this.roomId)
                return
            Room.get(this.roomId).setGameTime(this, active)
        }

        selectVote(index) {
            if (!this.roomId)
                return
            Room.get(this.roomId).selectVote(this, index)
        }

        setSkin(id) {
            if (id < 1)
                this.pureGraphics = 'KJT'
            else {
                const check = this.inventory.find(i => i.id === id)
                if (!check)
                    return
                const item = Shop.get(id)
                if (!item)
                    return
                const min = moment().diff(moment(check.expiry), 'minutes')
                if (min > 0)
                    return
                if (item.type === 'SKIN')
                    this.pureGraphics = item.icon
                else if (item.type === 'DEAD_SKIN')
                    this.deadGraphics = item.icon
            }
            this.send(Serialize.UserData(this))
        }

        setState(state) {
            this.state = PlayerState[state]
        }

        setGraphics(graphics) {
            this.graphics = graphics
            this.publishToMap(Serialize.SetGraphics(this))
        }

        turn(x, y) {
            this.state.turn(this, x, y)
        }

        move(x, y, timestamp) {
            this.timestamp = timestamp
            this.state.move(this, x, -y)
        }

        chat(message) {
            const room = Room.get(this.roomId)
            if (!room)
                return
            message = message.substring(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;')
            const now = new Date().getTime()
            if (this.lastChatTime.getTime() > now)
                return this.send(Serialize.SystemMessage('운영진에 의해 채팅이 금지되었습니다. (' + this.lastChatTime + ')', 'red'))
            let text = message.replace(/[^ㄱ-ㅎ가-힣]/g, '')
            if (!filtering.check(text)) {
                ++this.alert
                if (this.alert >= 5)
                    this.send(Serialize.QuitGame())
                else {
                    this.send(Serialize.Vibrate())
                    this.send(Serialize.SystemMessage('금칙어를 언급하여 경고 ' + this.alert + '회를 받았습니다. 5회 이상시 자동 추방됩니다.', 'red'))
                }
                return
            }
            if (this.command(message))
                return
            console.log(this.name + '(#' + this.roomId + '@' + this.place + '): ' + message)
            switch (room.type) {
                case RoomType.PLAYGROUND:
                    this.publish(Serialize.ChatMessage(this.type, this.index, this.name, message))
                    break
                default:
                    this.gameChat(message)
                    break
            }
        }

        command(message) {
            if (message.substring(0, 1) === '#') {
                if (this.admin < 1) {
                    /*if (this.cash < 20)
                        this.send(Serialize.SystemMessage('<color=red>보석이 부족합니다. 보석 20개가 필요합니다.</color>'))
                    else {
                        this.notice(Serialize.SystemMessage('<color=#1DDB16>' + this.name + '#' + this.roomId + ': ' + message.substring(1) + '</color>'))
                        this.setUpCash(-20)
                    }*/
                } else
                    this.notice(Serialize.SystemMessage('@[' + (this.admin === 1 ? '운영자' : '개발자') + '] ' + this.name + ': ' + message.substring(1), '#EFE4B0'))
                return true
            }
            if (this.admin < 1)
                return false
            const piece = message.split(',')
            let name
            let target
            let description
            let days
            let cash
            switch (message.substring(0, 3)) {
                case '!tp':
                    if (this.admin < 2)
                        return false
                    if (piece.length <= 1)
                        return true
                    target = Room.get(this.roomId).users.find(u => u.name === piece[1])
                    if (!target)
                        return true
                    if (piece.length <= 2)
                        this.teleport(target.place, target.x, target.y)
                    else {
                        const target2 = Room.get(this.roomId).users.find(u => u.name === piece[2])
                        if (target2)
                            target2.teleport(target.place, target.x, target.y)
                    }
                    break
                case '!보석':
                    if (this.admin < 2)
                        return false
                    if (piece.length <= 1) {
                        this.send(Serialize.SystemMessage('!보석,지급 개수 (1 ~ 10000)', 'red'))
                        return true
                    }
                    cash = Number(piece[1])
                    if (cash < 1 || cash > 10000)
                        cash = 1
                    for (const user of User.users) {
                        user.setUpCash(cash)
                        user.send(Serialize.SystemMessage(this.name + '님께서 보석 ' + cash + '개를 지급해주셨습니다!!!', '#FFC90E>'))
                    }
                    break
                case '!채금':
                    if (piece.length <= 2) {
                        this.send(Serialize.SystemMessage('!채금,닉네임,일 단위 (1 ~ 3650)', 'red'))
                        return true
                    }
                    name = piece[1]
                    days = piece.length > 2 ? Number(piece[2]) : 3650
                    if (days < 1 || days > 3650)
                        days = 3650
                    target = User.users.find(u => u.name === name)
                    if (target) {
                        const d = new Date()
                        d.setDate(d.getDate() + days)
                        target.lastChatTime = d
                        target.send(Serialize.SystemMessage('클린유저 또는 운영진에 의해 채팅이 금지되었습니다.', 'red'))
                        this.send(Serialize.SystemMessage(name + (pix.maker(name) ? '를' : '을') + ' ' + days + '일 동안 채팅을 금지함.', 'red'))
                    } else
                        this.send(Serialize.SystemMessage(name + (pix.maker(name) ? '는' : '은') + ' 접속하지 않았거나 존재하지 않음.', 'red'))
                    break
                case '!채해':
                    if (piece.length <= 1) {
                        this.send(Serialize.SystemMessage('!채해,닉네임', 'red'))
                        return true
                    }
                    name = piece[1]
                    target = User.users.find(u => u.name === name)
                    if (target) {
                        const d = new Date()
                        target.lastChatTime = d
                        target.send(Serialize.SystemMessage('클린유저 또는 운영진에 의해 채팅 금지가 해제되었습니다.', 'red'))
                        this.send(Serialize.SystemMessage(name + (pix.maker(name) ? '를' : '을') + ' 채팅 금지를 해제함.', 'red'))
                    } else
                        this.send(Serialize.SystemMessage(name + (pix.maker(name) ? '는' : '은') + ' 접속하지 않았거나 존재하지 않음.', 'red'))
                    break
                case '!차단':
                    if (piece.length <= 2) {
                        this.send(Serialize.SystemMessage('!차단,닉네임,욕설 사용,일 단위 (1 ~ 3650)', 'red'))
                        return true
                    }
                    name = piece[1]
                    description = piece[2]
                    days = piece.length > 2 ? Number(piece[3]) : 3650
                    if (days < 1 || days > 3650)
                        days = 3650
                    target = User.users.find(u => u.name === name)
                    if (target)
                        this.ban(target, name, description, days)
                    else
                        this.send(Serialize.ChatMessage(null, null, null, name + (pix.maker(name) ? '는' : '은') + ' 접속하지 않았거나 존재하지 않음.', 'red'))
                    break
                case '!메모':
                    if (piece.length <= 1) {
                        this.send(Serialize.SystemMessage('!메모,닉네임,내용 (공백시 정보 요청)', 'red'))
                        return true
                    }
                    name = piece[1]
                    description = piece.length > 2 ? piece[2] : ''
                    target = User.users.find(u => u.name === name)
                    if (target) {
                        if (description !== '')
                            target.memo = description
                        this.send(Serialize.SystemMessage(name + '#메모: ' + target.memo, '#FFC90E'))
                    } else
                        this.send(Serialize.SystemMessage(name + (pix.maker(name) ? '는' : '은') + ' 접속하지 않았거나 존재하지 않음.', 'red'))
                    break
                default:
                    return false
            }
            return true
        }

        async ban(user, name, description, days) {
            if (user) {
                await DB.InsertBlock(user.verify.loginType, user.verify.id, user.verify.uuid, name, description, days)
                user.send(Serialize.QuitGame())
                this.publish(Serialize.SystemMessage(name + (pix.maker(name) ? '를' : '을') + ' ' + days + '일 동안 접속을 차단함. (' + description + ')', 'red'))
                console.log(name + (pix.maker(name) ? '를' : '을') + ' ' + days + '일 동안 접속을 차단함. (' + description + ')')
            } else {
                const findUser = await DB.FindUserByName(name)
                if (findUser) {
                    await DB.InsertBlock(findUser.login_type, findUser.uid, findUser.uuid, name, description, days)
                    this.publish(Serialize.SystemMessage(name + (pix.maker(name) ? '를' : '을') + ' ' + days + '일 동안 접속을 차단함. (' + description + ')', 'red'))
                    console.log(name + (pix.maker(name) ? '를' : '을') + ' ' + days + '일 동안 접속을 차단함. (' + description + ')')
                }
            }
        }

        gameChat(message) {
            if (!this.roomId)
                return
            Room.get(this.roomId).gameChat(this, message)
        }

        entry(type = RoomType.GAME) {
            if (this.roomId)
                return
            this.timestamp = 0
            this.speedhackrate = 0
            this.setState('Basic')
            this.send(Serialize.LeaveWardrobe())
            let room = Room.available(type)
            if (!room)
                room = Room.create(type, this.name + '의 방')
            room.join(this)
        }

        leave() {
            if (!this.roomId)
                return
            Room.get(this.roomId).leave(this)
        }

        hit() {
            if (!this.roomId)
                return
            Room.get(this.roomId).hit(this)
        }

        useItem() {
            if (!this.roomId)
                return
            Room.get(this.roomId).useItem(this)
        }

        getUserJobMemo() {
            if (!this.roomId)
                return
            const room = Room.get(this.roomId)
            this.send(Serialize.GetUserJobMemo(room.users, room.type === RoomType.RANK_GAME))
        }

        portal(place, x, y, dx = 0, dy = 0) {
            this.timestamp = 0
            this.broadcastToMap(Serialize.RemoveGameObject(this))
            this.place = place
            this.setPosition(x, y)
            if (!(dx == dy && dx == 0))
                this.turn(dx, dy)
            this.send(Serialize.Portal(place, x, y, this.direction))
        }

        teleport(place, x, y) {
            if (!this.roomId)
                return
            Room.get(this.roomId).teleport(this, place, x, y)
        }

        result(ad) {
            if (!this.game.result)
                return
            switch (ad) {
                case 1:
                    this.reward.cash += 10
                    break
                case 2:
                    this.entry(RoomType.GAME)
                    break
                case 3:
                    this.entry(RoomType.RANK_GAME)
                    break
            }
            this.reward.send(this)
            this.score.send(this)
            this.game.result = false
        }

        getJSON() {
            return {
                index: this.index,
                type: this.type,
                id: this.id,
                name: this.name,
                level: this.level,
                exp: this.exp,
                coin: this.coin,
                admin: this.admin
            }
        }

        async disconnect() {
            this.leave()
            User.removeByUser(this)
            if (!await DB.UpdateUser(this))
                logger.log('유저 정보 저장 실패 ' + JSON.stringify(user.getJSON()))
            if (this.inventory.length > 0) {
                if (!await DB.DeleteInventory(this.id))
                    logger.log('유저 인벤토리 삭제 실패 ' + JSON.stringify(user.getJSON()))
                if (!await DB.InsertInventory(this.id, this.inventory))
                    logger.log('유저 인벤토리 저장 실패 ' + JSON.stringify(user.getJSON()))
            }
        }

        send(data) {
            if (this.socket.readyState === 1)
                this.socket.send(data)
        }

        notice(data) {
            const users = User.users
            for (const user of users)
                user.send(data)
        }

        publish(data) {
            if (!this.roomId)
                return
            Room.get(this.roomId).publish(data)
        }

        broadcast(data) {
            if (!this.roomId)
                return
            Room.get(this.roomId).broadcast(this, data)
        }

        broadcastToMap(data) {
            if (!this.roomId)
                return
            Room.get(this.roomId).broadcastToMap(this, data)
        }

        broadcastToDead(data) {
            if (!this.roomId)
                return
            Room.get(this.roomId).broadcastToDead(this, data)
        }


        publishToMap(data) {
            if (!this.roomId)
                return
            Room.get(this.roomId).publishToMap(this.place, data)
        }
    }
})()