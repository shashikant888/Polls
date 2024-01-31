const express = require("express");
const Poll = require("../models/poll.js");
const User = require("../models/user");
const QuestionSet = require('../models/questionSet');
const Option = require('../models/option');
const PollAnalytics = require('../models/pollAnalytics.js');

const createPoll = async (req, res) => {
  try {
    const { title, category, startDate, endDate, minReward, maxReward } = req.body;

    const poll = await Poll.create({
      title,
      category,
      startDate,
      endDate,
      minReward,
      maxReward,
    });
    res.status(201).json({ message: "Poll created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updatePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { title, category, startDate, endDate, minReward, maxReward } = req.body;

    // Find the poll to update
    let poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Update the poll
    poll.title = title || poll.title;
    poll.category = category || poll.category;
    poll.startDate = startDate || poll.startDate;
    poll.endDate = endDate || poll.endDate;
    poll.minReward = minReward || poll.minReward;
    poll.maxReward = maxReward || poll.maxReward;
    await poll.save();

    res.status(200).json({ message: "Poll updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addQuestionSet = async (req, res) => {
  try {
    const { pollId, questionType, questionText, options } = req.body;

    // Find the poll
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Create the question set associated with the poll
    const questionSet = await QuestionSet.create({
      pollId,
      questionType,
      questionText,
    });

    const createdOptions = await Option.bulkCreate(
      options.map((option) => ({ questionSetId: questionSet.id, text: option }))
    );

    res
      .status(200)
      .json({ message: "Question set added to poll successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateQuestionSet = async (req, res) => {
  try {
    const { pollId, questionId } = req.params; 
    const { questionText, options, questionType } = req.body; 

    // Validate request body
    if (!questionText && !options && !questionType) {
      return res.status(400).json({ error: 'At least one parameter must be provided to update the question set' });
    }

    // Find the specified poll
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Find the specified question set within the poll
    const questionSet = await QuestionSet.findOne({ where: { id: questionId, pollId: pollId } });
    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found for the specified poll' });
    }

    // Update the question set properties
    if (questionText) {
      questionSet.questionText = questionText;
    }
    if (options) {
      questionSet.options = options;
      // questionSet.options = JSON.stringify(options);
    }
    if (questionType) {
      questionSet.questionType = questionType;
    }

    // Save the changes to the database
    await questionSet.save();

    // Return the updated question set in the response
    res.status(200).json({ message: 'Question set updated successfully', questionSet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPollsWithAnalytics = async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;

    const totalCount = await Poll.count(); // Get total count of records
    const polls = await Poll.findAll({
      include: [
        {
          model: QuestionSet,
          include: [Option]
        }
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize < 0 ? 0 : (page - 1) * pageSize // Ensure offset is non-negative
    });

    if (polls.length === 0) {
      return res.status(404).json({ message: 'No polls found' });
    }

    const pollsWithAnalytics = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      category: poll.category,
      startDate: poll.startDate,
      endDate: poll.endDate,
      totalVotes: calculateTotalVotes(poll),
      questionSets: poll.QuestionSets.map(questionSet => ({
        id: questionSet.id,
        questionType: questionSet.questionType,
        questionText: questionSet.questionText,
        options: questionSet.Options.map(option => option.text)
      }))
    }));

    res.status(200).json({ polls: pollsWithAnalytics, totalPolls: totalCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function calculateTotalVotes(poll) {
  let totalVotes = 0;
  if (poll && poll.QuestionSets) {
    poll.QuestionSets.forEach(questionSet => {
      if (questionSet && questionSet.Options) {
        questionSet.Options.forEach(option => {
          totalVotes += option.votes || 0; // Ensure votes property exists and add to total
        });
      }
    });
  }
  return totalVotes;
}

const submitPoll = async (req, res) => {
  try {
    const { userId, pollId, selectedOption } = req.body;

    // Finding the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Finding the poll
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Validating the selected option
    const questionSet = poll.questionSets.find(questionSet => questionSet.options.includes(selectedOption));
    if (!questionSet) {
      return res.status(400).json({ error: 'Selected option is not valid for the question' });
    }

    // Calculating a reward amount within the range of min and max rewards
    const rewardAmount = calculateRewardAmount(poll.minReward, poll.maxReward);

    // Updating the user's data to indicate that they have completed the question
    // Store the completed questionId and pollId in the user's data
    user.completedQuestions.push({ questionId: questionSet.id, pollId: poll.id });
    await user.save();

    // Storing analytics for the poll, including the total votes and counts of options selected
    let pollAnalytics = await PollAnalytics.findOne({ where: { pollId: poll.id } });
    if (!pollAnalytics) {
      pollAnalytics = await PollAnalytics.create({ pollId: poll.id });
    }
    pollAnalytics.totalVotes += 1;
    pollAnalytics.optionCounts[selectedOption] = (pollAnalytics.optionCounts[selectedOption] || 0) + 1;
    await pollAnalytics.save();

    // Return the reward amount earned by the user for submitting the poll
    res.status(200).json({ rewardAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const calculateRewardAmount = (minReward, maxReward) => {
  // Useing a randomization mechanism to calculate the reward amount within the specified range
  return Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
};



module.exports = {
  createPoll,
  updatePoll,
  addQuestionSet,
  getAllPollsWithAnalytics,
  updateQuestionSet,
  submitPoll
};
