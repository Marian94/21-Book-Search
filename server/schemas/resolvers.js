const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).population("books");
      }
      throw new AuthenticationError("[X] ERROR, YOU MUST LOGIN FIRST!");
    },
  },
  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      const checkPassword = await user.isCorrectPassword(password);
      const token = signToken(user);
      if (!user || !checkPassword) {
        throw new AuthenticationError("[X] ERROR, EMAIL OR PASSWORD INCORRECT");
      }
      return { token, user };
    },
    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError(
        "[X] SAVE BOOK ERROR, YOU MUST LOGIN FIRST!"
      );
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updateUser = await User.findOneAndUpdate(
          {
            _id: context.user._id,
          },
          { $pull: { saveBooks: { bookId: bookId } } },
          { new: true }
        );
        return updateUser;
      }
      throw new AuthenticationError(
        "[X] REMOVE BOOK ERROR, YOU MUST LOGIN FIRST!"
      );
    },
  },
};
