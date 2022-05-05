const joi = require('joi')
const { createSchema } = require('../index')
const yup = require('yup')

const joiSchema2 = joi.object().keys({
  nickName: joi.string().required().min(3).max(20).example('鹄思乱想').label('Hero Nickname')
    .regex(/^[a-z]+$/, { name: 'alpha', invert: true }),
  avatar: joi.string().uri().allow(null).default(null),
  email: joi.string().email(),
  ip: joi.string().ip({ version: ['ipv4', 'ipv6'] }),
  hostname: joi.string().hostname().insensitive(),
  gender: joi.string().valid('Male', 'Female', '').default('Female'),
  height: joi.number().positive().greater(0).less(200), // .precision(2)
  birthday: joi.date().iso(),
  birthTime: joi.date().timestamp('unix'),
  skills: joi.array().items(joi.alternatives().try(
    joi.string(),
    joi.object().keys({
      name: joi.string().example('teleport').alphanum().lowercase().required().description('Skill Name'),
      level: joi.number().integer().min(10).max(100).default(50).multiple(20).example(20).description('Skill Level')
    })
  ).required()).min(1).max(3).unique().label('Skills'),
  tags: joi.array().items(joi.string().required()).length(2).required(),
  certificate: joi.binary().encoding('base64').allow(null).default(null).label('Certificate'),
  notes: joi.any().meta({ form: { type: 'select', options: [{ value: 'all', text: 'All' }, { value: 'some', text: 'Some' }] } })
})

// const schema2 = yup.object().shape({
  // gender: yup.string().oneOf(['Male', 'Female', '']).default('Male')
// })

const schema3 = yup.object().shape({
  gender: yup.string().oneOf(['Male', 'Female', '']).default('Male')
})

// const joiSchema = joi.object({
//   show: joi.string().required(),
//   show_name: joi.string().required(),
//   season: joi.number().required(),
//   active: joi.number().allow(0, 1).default(1),
//   deleted: joi.number().allow(0, 1).default(0)
// });

const joiSchema = joi.object({
  show: joi.string().required(),
  show_name: joi.string().required(),
  season: joi.number().required(),
  season_ep_str: joi.string().required(),
  status: joi.string().required(),
  episode_name: joi.string().allow('').default(null),
  first_aired: {
    str: joi.string().allow('', null).default(null),
    date: joi.date().allow(null).default(null),
  },
  torrent: joi.object().meta({ mongoose: { type: 'mixed' } }).default({}),
  torrent_add: joi.object().meta({ mongoose: { type: 'mixed' } }).default({}),
  active: joi.number().allow(0, 1).default(1),
  deleted: joi.number().allow(0, 1).default(0)
});

const main = async () => {
  /*let schema = createSchema(jsonSchema)
  schema.validate({
    avatar: 1,
    gender: 'Male',
    skills: ['jkh']
  }).then(vals => {
    // console.log(vals, 'vals2')
  }).catch(ex => {
    console.log(ex, 'ex2')
  })*/

  const joiDesc = joiSchema.describe()
  // console.log(joiDesc.keys.notes.metas[0].form, 'joiSchema.describe()')
  // console.log(JSON.stringify(joiDesc), 'joiSchema.describe()')
  let schema = createSchema(joiDesc)

  // schema.validate({
  //   nickName: 'jdjdj',
  //   avatar: 'http://google.com?hello=world&a=b',
  //   gender: 'Male',
  //   skills: ['1','2','3'],
  //   tags: [1, 2]
  //   // certificate: null
  // }).then(vals => {
  //   console.log(vals, 'vals2')
  // }).catch(ex => {
  //   console.log(ex, 'ex2')
  // })
  schema.validate({
    show: 'Show',
    show_name: 'Some Show',
    episode_name: 'Hello',
    season: 1,
    season_ep_str: 'Hello World',
    status: 'queued',
  }).then(vals => {
    console.log(vals, 'vals2')
  }).catch(ex => {
    console.log(ex, 'ex2')
  })
}
main()