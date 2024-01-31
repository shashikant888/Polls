const express = require('express');
const pollController = require('../controllers/pollController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/createUser', userController.createUser);
router.post('/createPoll',pollController.createPoll);
router.post('/polls/:pollId/questionSets', pollController.addQuestionSet);
router.put('/polls/:pollId/questionSets/:questionId', pollController.updateQuestionSet);
router.get('/polls', pollController.getAllPollsWithAnalytics);
router.put('/polls/:pollId', pollController.updatePoll);
router.post('/submitPoll', pollController.submitPoll);

module.exports = router;