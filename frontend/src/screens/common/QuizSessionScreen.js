import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../theme/typography';
import { Header } from '../../components/Header';
import { Button } from '../../components/Button';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectCurrentProfile } from '../../features/auth/authSelectors';
import { updateProfilePoints } from '../../features/auth/authSlice';
import { fetchMyProfile } from '../../features/students/studentThunks';
import { fetchLeaderboard } from '../../features/leaderboard/leaderboardThunks';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const QUIZ_BANKS = {
  cs: {
    title: 'Computer Science & Algorithms',
    icon: 'code-slash',
    questions: [
      {
        question: 'What is the average time complexity of QuickSort?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
        answer: 1,
        explanation: 'QuickSort has an average-case time complexity of O(n log n) by partitioning around a pivot.',
      },
      {
        question: 'Which data structure uses the LIFO (Last In, First Out) principle?',
        options: ['Queue', 'Linked List', 'Stack', 'Binary Tree'],
        answer: 2,
        explanation: 'A Stack is a LIFO structure where the last element pushed is the first to be popped.',
      },
      {
        question: 'What is the space complexity of an in-place sorting algorithm?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
        answer: 0,
        explanation: 'In-place algorithms require only a constant amount O(1) of auxiliary space beyond the input array.',
      },
      {
        question: 'Which algorithm is guaranteed to find the shortest path in an unweighted graph?',
        options: ['Depth First Search (DFS)', 'Breadth First Search (BFS)', 'Kruskal Algorithm', 'Binary Search'],
        answer: 1,
        explanation: 'BFS explores neighbor nodes level by level, ensuring the shortest path in unweighted graphs.',
      },
      {
        question: 'In asymptotic analysis, what does Big-O notation describe?',
        options: ['Best-case scenario', 'Tight bound', 'Upper bound / Worst-case growth', 'Exact runtime in seconds'],
        answer: 2,
        explanation: 'Big-O notation describes the upper bound of the growth rate of an algorithm as input size scales.',
      },
    ],
  },
  db: {
    title: 'Database & SQL Systems',
    icon: 'server',
    questions: [
      {
        question: 'What does ACID stand for in database transactions?',
        options: [
          'Atomicity, Consistency, Isolation, Durability',
          'Access, Control, Integrity, Data',
          'Aggregation, Connection, Indexing, Deletion',
          'Authentication, Concurrency, Isolation, Deployment',
        ],
        answer: 0,
        explanation: 'ACID guarantees database transaction reliability: Atomicity, Consistency, Isolation, and Durability.',
      },
      {
        question: 'Which SQL clause is used to filter groups created by GROUP BY?',
        options: ['WHERE', 'ORDER BY', 'HAVING', 'FILTER'],
        answer: 2,
        explanation: 'HAVING filters aggregate groups, whereas WHERE filters individual rows before aggregation.',
      },
      {
        question: 'What data structure is standard for B-Tree database indexes?',
        options: ['Hash Table', 'Balanced Multiway Search Tree', 'Singly Linked List', 'Heap'],
        answer: 1,
        explanation: 'B-Trees are self-balancing search trees optimized for disk block reads and range queries.',
      },
      {
        question: 'What is a Foreign Key in relational databases?',
        options: [
          'A key generated in another country',
          'A field linking to the Primary Key of another table',
          'An encrypted master password',
          'A temporary index discarded on reboot',
        ],
        answer: 1,
        explanation: 'A Foreign Key enforces referential integrity by pointing to the Primary Key of another relation.',
      },
      {
        question: 'Which normal form eliminates partial dependencies on a composite primary key?',
        options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'BCNF'],
        answer: 1,
        explanation: '2NF requires 1NF and guarantees that all non-key attributes are fully dependent on the primary key.',
      },
    ],
  },
  web: {
    title: 'Full Stack & Web Architecture',
    icon: 'globe',
    questions: [
      {
        question: 'What HTTP status code represents "Created" after a successful POST request?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
        answer: 1,
        explanation: 'HTTP 201 indicates that the request succeeded and led to the creation of a new resource.',
      },
      {
        question: 'In JWT (JSON Web Tokens), how many parts are separated by periods (.)?',
        options: ['2 (Header, Body)', '3 (Header, Payload, Signature)', '4 (Header, Claims, Crypto, Signature)', '1'],
        answer: 1,
        explanation: 'A JWT comprises three Base64URL-encoded parts: Header, Payload, and Signature.',
      },
      {
        question: 'What React Hook is used to handle side-effects like data fetching or timers?',
        options: ['useState', 'useMemo', 'useEffect', 'useCallback'],
        answer: 2,
        explanation: 'useEffect executes side effects after render commitments in functional components.',
      },
      {
        question: 'What is the purpose of CORS (Cross-Origin Resource Sharing)?',
        options: [
          'To compress HTTP images',
          'To allow or restrict resources requested from another domain',
          'To replace SSL/TLS encryption',
          'To format JSON responses',
        ],
        answer: 1,
        explanation: 'CORS is a browser security mechanism that restricts cross-origin HTTP requests unless permitted.',
      },
      {
        question: 'What does Redux use to ensure predictable, immutable state transitions?',
        options: ['Pure Reducer Functions', 'Global Mutable Variables', 'Direct DOM Mutation', 'WebSockets'],
        answer: 0,
        explanation: 'Redux uses pure functions (reducers) that calculate the next state without mutating previous state.',
      },
    ],
  },
};

export const QuizSessionScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectCurrentProfile);

  const [activeCategory, setActiveCategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pointsClaimed, setPointsClaimed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuiz = activeCategory ? QUIZ_BANKS[activeCategory] : null;
  const currentQuestion = currentQuiz ? currentQuiz.questions[currentQuestionIndex] : null;

  const startQuiz = (catKey) => {
    setActiveCategory(catKey);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsCompleted(false);
    setPointsClaimed(false);
    setIsSubmitting(false);
  };

  const handleResetToTopics = () => {
    setActiveCategory(null);
    setIsCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setPointsClaimed(false);
    setIsSubmitting(false);
  };

  const handleSelectOption = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handleClaimPoints = async () => {
    const earnedPoints = score * 20; // 20 points per question
    if (earnedPoints <= 0) {
      Alert.alert('Quiz Finished', 'No points to claim this time. Try again to score higher!');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/points/quiz-reward', {
        points: earnedPoints,
        topic: currentQuiz?.title || 'Quick Quiz',
        score: score,
        totalQuestions: currentQuiz?.questions?.length || 5,
      });

      // Synchronize updated profile and leaderboard directly from the database
      await Promise.allSettled([
        dispatch(fetchMyProfile()),
        dispatch(fetchLeaderboard()),
      ]);

      setPointsClaimed(true);
      Alert.alert(
        '🎉 Points Saved to Total!',
        `+${earnedPoints} points have been successfully added to your total in the database!\nYour total points and leaderboard standing are now updated.`
      );
    } catch (err) {
      console.warn('API error claiming quiz points:', err);
      // Fallback local update if offline
      if (profile?.id) {
        dispatch(
          updateProfilePoints({
            studentId: profile.id,
            newPoints: (profile.totalPoints || 0) + earnedPoints,
          })
        );
      }
      setPointsClaimed(true);
      Alert.alert(
        'Points Credited',
        `+${earnedPoints} points updated in your session.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Quick Quiz Session"
        subtitle={activeCategory && currentQuiz ? currentQuiz.title : 'Test your skills & earn points'}
        showBack
        onBack={() => {
          if (activeCategory && !isCompleted) {
            setActiveCategory(null);
          } else if (isCompleted) {
            handleResetToTopics();
          } else {
            navigation.goBack();
          }
        }}
        rightAction={<ThemeToggle />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Category Selection View */}
        {!activeCategory && (
          <View>
            <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.welcomeIconCircle, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="flash" size={32} color={theme.primary} />
              </View>
              <Text style={[typography.h2, { color: theme.text, marginTop: 12 }]}>
                Interactive Quiz Challenge
              </Text>
              <Text style={[typography.bodyMedium, { color: theme.textSecondary, marginTop: 6, textAlign: 'center' }]}>
                Select a topic below to begin a 5-question quick quiz. Earn +20 bonus points per correct answer for your leaderboard ranking!
              </Text>
            </View>

            <Text style={[typography.h3, { color: theme.text, marginTop: 24, marginBottom: 12 }]}>
              Available Quiz Topics
            </Text>

            {Object.keys(QUIZ_BANKS).map((key) => {
              const quiz = QUIZ_BANKS[key];
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => startQuiz(key)}
                  style={[styles.categoryCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name={quiz.icon} size={24} color={theme.primary} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[typography.h3, { color: theme.text }]}>{quiz.title}</Text>
                    <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                      5 Questions • +100 Max Points
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Active Quiz Session View */}
        {activeCategory && !isCompleted && currentQuestion && (
          <View>
            {/* Progress & Live Score Bar */}
            <View style={[styles.statusBarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.statusBarRow}>
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                  QUESTION {currentQuestionIndex + 1} OF {currentQuiz.questions.length}
                </Text>
                <Text style={[typography.caption, { color: theme.success, fontWeight: '700' }]}>
                  SCORE: {score * 20} PTS
                </Text>
              </View>
              <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Question Card */}
            <View style={[styles.questionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[typography.h2, { color: theme.text, lineHeight: 28 }]}>
                {currentQuestion.question}
              </Text>
            </View>

            {/* Multiple Choice Options */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.answer;

                let optBg = theme.card;
                let optBorder = theme.border;
                let optText = theme.text;
                let badgeBg = theme.border;
                let badgeText = theme.textSecondary;

                if (isAnswered) {
                  if (isCorrect) {
                    optBg = theme.mode === 'dark' ? '#064E3B' : '#D1FAE5';
                    optBorder = theme.success;
                    optText = theme.success;
                    badgeBg = theme.success;
                    badgeText = '#FFFFFF';
                  } else if (isSelected) {
                    optBg = theme.mode === 'dark' ? '#7F1D1D' : '#FEE2E2';
                    optBorder = theme.danger;
                    optText = theme.danger;
                    badgeBg = theme.danger;
                    badgeText = '#FFFFFF';
                  }
                } else if (isSelected) {
                  optBorder = theme.primary;
                  optBg = theme.primaryLight;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    style={[
                      styles.optionButton,
                      { backgroundColor: optBg, borderColor: optBorder },
                    ]}
                  >
                    <View style={[styles.optionBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.optionBadgeText, { color: badgeText }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={[typography.bodyMedium, { color: optText, flex: 1 }]}>
                      {option}
                    </Text>
                    {isAnswered && isCorrect && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.success} />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <Ionicons name="close-circle" size={22} color={theme.danger} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Explanation & Next Step */}
            {isAnswered && (
              <View style={[styles.explanationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="bulb-outline" size={20} color={theme.primary} />
                  <Text style={[typography.label, { color: theme.primary, marginLeft: 6 }]}>
                    Explanation
                  </Text>
                </View>
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
                  {currentQuestion.explanation}
                </Text>

                <Button
                  title={currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Next Question ➔' : 'Complete Quiz 🎉'}
                  onPress={handleNextQuestion}
                  style={{ marginTop: 16 }}
                />
              </View>
            )}
          </View>
        )}

        {/* Completion Screen */}
        {isCompleted && (
          <View style={[styles.completionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.trophyCircle, { backgroundColor: theme.gold + '20' }]}>
              <Ionicons name="trophy" size={54} color={theme.gold} />
            </View>

            <Text style={[typography.h1, { color: theme.text, marginTop: 16 }]}>
              Quiz Completed!
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.textSecondary, marginTop: 6, textAlign: 'center' }]}>
              Great effort in the {currentQuiz?.title || 'Quiz'} challenge!
            </Text>

            <View style={[styles.scoreSummaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.scoreRow}>
                <Text style={[typography.bodyMedium, { color: theme.textSecondary }]}>Correct Answers</Text>
                <Text style={[typography.h3, { color: theme.text }]}>
                  {score} / {currentQuiz?.questions?.length || 5}
                </Text>
              </View>

              <View style={[styles.scoreRow, { marginTop: 10 }]}>
                <Text style={[typography.bodyMedium, { color: theme.textSecondary }]}>Accuracy</Text>
                <Text style={[typography.h3, { color: theme.primary }]}>
                  {Math.round((score / (currentQuiz?.questions?.length || 5)) * 100)}%
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.scoreRow}>
                <Text style={[typography.bodyMedium, { color: theme.text, fontWeight: '700' }]}>Points Earned</Text>
                <Text style={[typography.h2, { color: theme.success }]}>
                  +{score * 20} pts
                </Text>
              </View>
            </View>

            {!pointsClaimed ? (
              <Button
                title={`⚡ Claim +${score * 20} Points to Profile`}
                onPress={handleClaimPoints}
                loading={isSubmitting}
                style={{ width: '100%', marginTop: 20 }}
              />
            ) : (
              <View style={[styles.claimedBanner, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
                <Ionicons name="checkmark-done-circle" size={24} color={theme.success} />
                <Text style={[typography.label, { color: theme.success, marginLeft: 8 }]}>
                  Points Credited Successfully!
                </Text>
              </View>
            )}

            <Button
              title="Try Another Topic"
              variant="outline"
              onPress={handleResetToTopics}
              style={{ width: '100%', marginTop: 12 }}
            />

            <Button
              title="Back to Dashboard"
              variant="secondary"
              onPress={() => navigation.goBack()}
              style={{ width: '100%', marginTop: 12 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  welcomeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  statusBarCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionBadgeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  explanationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completionCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreSummaryCard: {
    width: '100%',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 20,
    width: '100%',
  },
});

