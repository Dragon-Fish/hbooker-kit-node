// import 'dotenv/config'
import aesjs from 'aes-js'
import axios from 'axios'
import { createHash } from 'crypto'

export class HBookerKit {
  constructor() {
    this.BASE_URL = 'https://app.hbooker.com'
    this.API_KEY = 'zG2nSeEfSHfvTCHy5LCcqtBbQehKNLXn'
    this.INTIAL_VECTOR = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    // Alias
    this.get = this.ajax.get
    this.post = this.ajax.post
  }

  decrypt(str) {
    const key = createHash('sha256')
      .update(this.API_KEY, 'utf8')
      .digest()
      .toJSON().data
    const cbc = new aesjs.ModeOfOperation.cbc(key, this.INTIAL_VECTOR)
    const bytes = cbc.decrypt(Buffer.from(str, 'base64'))
    const text = aesjs.utils.utf8.fromBytes(bytes)
    return JSON.parse(text.slice(0, text.lastIndexOf('}') + 1))
  }

  get ajax() {
    const client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Accept-Encoding': 'gzip',
        Connection: 'Keep-Alive',
        Host: 'app.hbooker.com',
        'User-Agent': 'Android com.kuangxiangciweimao.novel',
      },
      params: {
        account: this?._user?.reader_info?.account,
        login_token: this?._user?.login_token,
      },
    })
    client.interceptors.response.use((ctx) => {
      ctx.data = this.decrypt(ctx.data)
      return ctx
    })
    return client
  }

  get loginToken() {
    return this?._user?.login_token
  }

  async login(login_name, passwd) {
    const { data } = await this.ajax.get('/signup/login', {
      params: {
        login_name,
        passwd,
      },
    })
    this._user = data?.data
    return data
  }

  async book(book_id) {
    return (
      await this.ajax.get('/book/get_info_by_id', {
        params: {
          book_id,
        },
      })
    ).data
  }
}