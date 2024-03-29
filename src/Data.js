const DB = require('./DB')
const GameMap = require('./GameMap')
const config = require('./config')

module.exports = (function () {
    const _static = { rank: [] }

    return class Data {
        static async loadData() {
            await Data.loadMaps()
            await Data.loadShops()
            await Data.loadItems()
            await Data.loadRanks()
            await Data.loadClans()
        }

        static async loadMaps() {
            console.log('맵 로딩중...')
            for (let i = 1; i <= config.MAP_COUNT; ++i) {
                const map = await GameMap.load(i)
                GameMap.add(map)
            }
            console.log('맵 로딩 완료.')
        }

        static async loadShops() {
            console.log('상점 로딩중...')
            const shops = require(`../Assets/Shops.json`)['shops']
            for (let i = 0; i < shops.length; ++i) {
                const shopData = shops[i]
                const shop = new Shop(shopData.id, shopData.type, shopData.icon, shopData.name, shopData.creator, shopData.creatorId, shopData.description, shopData.cost, shopData.isCash, shopData.method)
                Shop.shops[i + 1] = shop
            }
            console.log('상점 로딩 완료.')
        }

        static async loadItems() {
            console.log('아이템 로딩중...')
            const items = require(`../Assets/Items.json`)['items']
            for (let i = 0; i < items.length; ++i) {
                const itemData = items[i]
                const item = new Item(itemData.id, itemData.num, itemData.icon, itemData.name, itemData.description, itemData.cost, itemData.method)
                Item.items[i + 1] = item
            }
            console.log('아이템 로딩 완료.')
        }

        static async loadRanks() {
            console.log('랭킹 로딩중...')
            let users = await DB.LoadRanks()
            let rankNum = 0
            for (const user of users) {
                const rank = {
                    id: user.id,
                    rank: user.admin > 0 ? 0 : ++rankNum,
                    name: user.name,
                    clanname: user.clanname,
                    level: user.level,
                    exp: user.exp,
                    point: user.point,
                    win: user.win,
                    lose: user.lose,
                    escape: user.escape,
                    rankWin: user.rankWin,
                    rankLose: user.rankLose,
                    rankEscape: user.rankEscape,
                    likes: 0,
                    memo: user.memo,
                    avatar: user.avatar
                }
                Data.rank.push(rank)
            }
            console.log('랭킹 로딩 완료.')
        }

        static async loadClans() {
            console.log('클랜 로딩중...')
            const clans = await DB.LoadClans()
            for (let i = 0; i < clans.length; ++i) {
                const clanData = clans[i]
                const clan = new Clan(
                    clanData.id,
                    clanData.master_id,
                    clanData.name,
                    clanData.level1_name,
                    clanData.level2_name,
                    clanData.level3_name,
                    clanData.level4_name,
                    clanData.level5_name,
                    clanData.notice,
                    clanData.level,
                    clanData.exp,
                    clanData.cash,
                    clanData.coin,
                    new Date(clanData.regdate),
                    clanData.condition
                )
                const clanmembers = await DB.LoadClanMembers(clan.id)
                for (let j = 0; j < clanmembers.length; ++j)
                    clan.members.push(clanmembers[j].user_id)
                Clan.clans[clan.id] = clan
            }
            console.log('클랜 로딩 완료.')
        }

        static get rank() {
            return _static.rank
        }
    }
})()