const Joi = require('joi');

const createTipSchema = Joi.object({
  creatorId: Joi.string().uuid().required(),
  amount: Joi.number().min(0.01).required(),
  currency: Joi.string().valid('cUSD', 'USD').required(),
  message: Joi.string().max(200).optional(),
  tipType: Joi.string().valid('public', 'anonymous').default('public'),
  bankrCommand: Joi.string().optional()
});

const createCreatorSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  bio: Joi.string().max(500).optional(),
  profilePicture: Joi.string().uri().optional(),
  country: Joi.string().length(2).uppercase().required(),
  platform: Joi.string().valid('frutero', 'instagram', 'youtube', 'tiktok').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

module.exports = {
  createTipSchema,
  createCreatorSchema,
  loginSchema
};