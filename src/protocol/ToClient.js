const { ENUM } = require('../util/pix')

module.exports = {
    ...ENUM(
        'USER_DATA',
        'VIBRATE',
        'CONNECTION_COUNT',
        'SYSTEM_MESSAGE',
        'INFORM_MESSAGE',
        'NOTICE_MESSAGE',
        'CHAT_MESSAGE',
        'PORTAL',
        'CREATE_GAME_OBJECT',
        'REMOVE_GAME_OBJECT',
        'SET_GRAPHICS',
        'PLAY_SOUND',
        'UPDATE_ROOM_USER_COUNT',
        'UPDATE_MODE_INFO',
        'UPDATE_GAME_ITEM',
        'REMOVE_GAME_ITEM',
        'SET_GAME_TEAM',
        'MODE_DATA',
        'GET_CLAN',
        'INVITE_CLAN',
        'DEAD_ANIMATION',
        'RESULT_GAME',
        'ENTER_WARDROBE',
        'LEAVE_WARDROBE',
        'SWITCH_LIGHT',
        'QUIT_GAME',
        'UPDATE_MODE_SCORE',
        'SET_OPTION_CLAN',
        'MEMBER_INFO_CLAN',
        'UPDATE_CLAN',
        'MESSAGE_CLAN',
        'GET_BILLING',
        'UPDATE_BILLING',
        'GET_SHOP',
        'GET_SKIN_ITEM',
        'MESSAGE_SHOP',
        'MESSAGE_LOBBY',
        'GET_SKIN_LIST',
        'UPDATE_CASH_AND_COIN',
        'GET_PAY_INFO_ITEM',
        'GET_RANK',
        'GET_USER_INFO_RANK',
        'MESSAGE_RANK',
        'GET_NOTICE_MESSAGE_COUNT',
        'GET_NOTICE_MESSAGE',
        'GET_INFO_NOTICE_MESSAGE',
        'DELETE_NOTICE_MESSAGE',
        'MESSAGE_GAME',
        'SET_ANIMATION',
        'COMBO_MESSAGE',
        'GET_ROOM_INFO',
        'GET_VOTE',
        'SET_UP_VOTE',
        'CLOSE_VOTE',
        'TOGGLE_HIT',
        'TOGGLE_TIME',
        'GET_USER_JOB_MEMO',
        'SET_UP_USER_JOB_MEMO',
        'REMOVE_USER_JOB_MEMO'
    )
}