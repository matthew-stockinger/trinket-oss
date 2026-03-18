import trinket.checks as checks
import trinket.ast as ast

__author__ = 'eah13'
'''
This is the start of something that behaves like
the unittest module from cpython.

Mostly written by Brad Miller.  Modified by Elliott Hauser.

Note that for now it gives a checkbox for every assert statement result. In the
future it might be better to do so for each test method.

'''

def quotify(thing):
    """Enquote if it's a string"""
    if type(thing) == type(""):
        return '"' + str(thing) + '"'
    return thing

# Our version of unittest's TestCase, to be extended as tests.
class TestCase:
    def __init__(self):
        self.numPassed = 0
        self.numFailed = 0
        self.assertPassed = 0
        self.assertFailed = 0
        self.extraTests = 0
        self.verbose = True
        self.tlist = []
        testNames = {}
        for name in dir(self):
            if name[:4] == 'test' and name not in testNames:
                self.tlist.append(getattr(self,name))
                testNames[name]=True

    def setUp(self):
        pass

    def tearDown(self):
        pass
    def cleanName(self,funcName):
    # work around skulpts lack of an __name__
        funcName = str(funcName)
        funcName = funcName[13:]
        funcName = funcName[:funcName.find('<')-3]
        return funcName

    def main(self):

        for func in self.tlist:
            if self.verbose:
                print('Running %s' % self.cleanName(func))
            try:
                self.setUp()
                self.assertPassed = 0
                self.assertFailed = 0
                func()
                self.tearDown()
                if self.assertFailed == 0:
                    self.numPassed += 1
                else:
                    self.numFailed += 1
                    print('Tests failed in %s ' % self.cleanName(func))
            except Exception as e:
                self.assertFailed += 1
                self.numFailed += 1
                print('Test threw exception in %s (%s)' % (self.cleanName(func), e))
                raise e
        self.showSummary()

    def assertEqual(self, actual, expected, feedback=""):
        res = actual==expected
        self.appendResult(res,str(actual),expected, feedback)

    def assertNotEqual(self, actual, expected, feedback=""):
        res = actual != expected
        self.appendResult(res,str(actual),expected,feedback)

    def assertTrue(self,x, feedback=""):
        res = bool(x) is True
        self.appendResult(res,str(x),True,feedback)

    def assertFalse(self,x, feedback=""):
        res = not bool(x)
        self.appendResult(res,str(x),False,feedback)

    def assertIs(self,a,b, feedback=""):
        res = a is b
        self.appendResult(res,str(a),b,feedback)

    def assertIsNot(self,a,b, feedback=""):
        res = a is not b
        self.appendResult(res,str(a),b,feedback)

    def assertIsNone(self,x, feedback=""):
        res = x is None
        self.appendResult(res,x,None,feedback)

    def assertIsNotNone(self,x, feedback=""):
        res = x is not None
        self.appendResult(res,str(x),None,feedback)

    def assertIn(self,a,b, feedback=""):
        res = a in b
        self.appendResult(res,str(a),b,feedback)

    def assertNotIn(self,a,b, feedback=""):
        res = a not in b
        self.appendResult(res,str(a),b,feedback)

    def assertIsInstance(self,a,b, feedback=""):
        res = isinstance(a,b)
        self.appendResult(res,str(a),b,feedback)

    def assertNotIsInstance(self,a,b, feedback=""):
        res = not isinstance(a,b)
        self.appendResult(res,str(a)+' to not be an instance of ',b,feedback)

    def assertAlmostEqual(self, a, b, places=7, feedback=""):
        res = round(a-b, places) == 0
        self.appendResult(res,str(a)+' to equal ',b,feedback)

    def assertNotAlmostEqual(self, a, b, places=7, feedback=""):
        res = round(a-b, places) != 0
        self.appendResult(res,str(a)+' to not equal ',b,feedback)

    def assertGreater(self,a,b, feedback=""):
        res = a > b
        self.appendResult(res,str(a)+' to be greater than ',b,feedback)

    def assertGreaterEqual(self,a,b, feedback=""):
        res = a >= b
        self.appendResult(res,str(a)+' to be greater than or equal to ',b,feedback)

    def assertLess(self,a,b, feedback=""):
        res = a < b
        self.appendResult(res,str(a)+' to be less than ',b,feedback)

    def assertLessEqual(self,a,b, feedback=""):
        res = a <= b
        self.appendResult(res,str(a)+' to be less than or equal to ',b,feedback)

    def appendResult(self,res,actual,expected,feedback):
        if res:
            msg = 'Pass'
            self.assertPassed += 1
            checks.addSuccess("Test name", feedback, "Great job!")
        else:
            msg = 'Fail: expected %s got %s ' % (str(actual),str(expected)) + feedback
            print(msg)
            self.assertFailed += 1
            checks.addFailure("Test name", feedback, feedback, "Your function returned %s." % actual)

    def assertRaises(self, exception, callable=None, *args, **kwds):
        # with is currently not supported hence we just try and catch
        if callable is None:
            raise NotImplementedError("assertRaises does currently not support assert contexts")
        if kwds:
            raise NotImplementedError("assertRaises does currently not support **kwds")

        res = False
        actualerror = str(exception())
        try:
            callable(*args)
        except exception as ex:
            res = True
        except Exception as inst:
            actualerror = str(inst)
            print("ACT = ", actualerror, str(exception()))
        else:
            actualerror = "No Error"

        self.appendResult(res, str(exception()), actualerror, "")

    def fail(self, msg=None):
        if msg is None:
            msg = 'Fail'
        else:
            msg = 'Fail: ' + msg
        print(msg)
        self.assertFailed += 1

    def showSummary(self):
      totalTests = self.numPassed+self.numFailed+self.extraTests
      pct = self.numPassed / totalTests * 100
      print("Ran %d tests, passed: %d failed: %d\n" % (totalTests, self.numPassed, self.numFailed))

    def addSuccess(self, _, display_title, more_info):
      """Directly add a success to the list"""
      self.assertPassed += 1
      self.extraTests += 1
      checks.addSuccess(_, display_title, more_info)

    def addFailure(self, _, display_title, more_info, hint):
      """Directly add a failure to the list"""
      self.assertFailed += 1
      self.extraTests += 1
      checks.addFailure(_, display_title, more_info, hint)

# For each Trinket test mode/type, make a subclass driven off of a variable
# that will be pulled from _settings.py. The tests.py in the Trinket can
# `from trinket.tester import YourNewClass` and only these tests will show up in
# the output.
#
# If it's impractical or impossible to make the class here you can always
# `import trinket.tester as unittest` and use it (mostly) normally.
class FunctionTests(TestCase):
  def setUp(self):
    try:
      # Requires a _settings file in the Trinket with answers dict and a student function
      # note to posterity: answers is a dict for ease of readability. Would be simpler to
      # use two lists (or list of lists), but this started out as a manual API and
      # key : value was easier to read than lining up two lists. So, function inputs
      # had to be tuples, even if they were intended as lists.  Hence the acrobatics of
      # converting from tuples to lists in here and the optional list_args.
      from _settings import answers, student_function
      try:
        from _settings import arity # Optional arity for test function
      except Exception as error:
        arity = 1
      try:
        from _settings import list_args

        # make sure custom list_args matches arity
        if len(list_args) != arity:
          raise ValueError("list_args must have same length as function arity")
        # make sure list_args is itself a list
        if not isinstance(list_args, list):
          raise ValueError("list_args must be a list")
      except Exception as error:
        # No list_args provided; Assume no args are lists
        list_args = [ False for x in range(arity)]

      self.answers = answers
      self.student_function = student_function
      self.arity = arity
      self.list_args = list_args
    except Exception as error:
      raise error

  def test_student_function(self):
    """Testing answers"""
    for question, answer in self.answers.items():
      if self.arity > 1:
        # If some args should be lists, convert them here
        if True in self.list_args:
          question = [ list(question[n]) if x else question[n] for n, x in enumerate(self.list_args)]
        student_answer = quotify(self.student_function(*question))
        question = ", ".join([quotify(q) for q in question])
      else:
        # if arity == 1 and arg should be a list, convert whole tuple to list
        if True in self.list_args:
          # We're expecting any purported lists to be tuples
          if not isinstance(question, tuple):
            raise ValueError("list arguments should be given as tuples.")
          question = list(question)
        student_answer = quotify(self.student_function(question))
        question = quotify(question)

      answer = quotify(answer)

      display_title = "{0}({1}) should return {2}".format(self.student_function.__name__,question, answer)

       # If the student unexpectedly returned nothing they probably forgot a return statement
      if student_answer == None and answer != None:
        self.addFailure("Test Name", display_title, "Your function returned None", "Does your function have a return statement? If so, are you returning an answer for this input?")
        continue
      else:
        # The student's answer should be the same as the answer key
        self.assertEqual(student_answer, answer, "{0}({1}) should return {2}".format(self.student_function.__name__,question, answer))

class SyntaxTests(TestCase):
  def setUp(self):
    try:
      # Requires a _settings file in the Trinket with answers, a student function, and a student filename
      from _settings import syntax_rules, student_function, student_file

      self.syntax_rules = syntax_rules
      self.student_function = student_function

      student_code = open(student_file)
      self.student_ast_tree = ast.parse(student_code.read())
      student_code.close()

    except Exception as error:
      raise error

    self.syntax_map = {
      "return statements": "Return", # Functions should return things. This will tell
      "functions": "FunctionDef", # Other than the main one being tested
      "lists": "List",
      "for loops": "For",
      "while loops": "While",
      "dicts": "Dict",
      "tuples": "Tuple",
      "sets": "Set",
      "strings": "Str",
      "boolean operators": "BoolOp",
      "slices": "Slice",
      "list coprehensions": "ListComp",
      "break statements": "Break",
      "continue statements": "Continue",
      "with statements": "With",
      "assignment statements": "Assign"
    }

  def test_syntax_rules(self):
    """Testing use of syntax elements"""
    for syntax, rule in self.syntax_rules.items():
      # Translate the setting to Skulpt ast name
      skulpt_ast_name = self.syntax_map[syntax]

      # Is the target syntax in the tree?
      contains_target = ast.contains(self.student_ast_tree,skulpt_ast_name)

      # Create appropriate prefixes for test message
      # These are backwards because they're only used in failures
      if rule == True:
        title_prefix = "Use "
        fail_prefix = "We didn't find "
      elif rule == False:
        title_prefix = "Don't use "
        fail_prefix = "We found "

      # Add success or failure, depending on rule
      if (contains_target and rule == True) or (not contains_target and rule == False):
        checks.addSuccess("", title_prefix + syntax, "Great job!")
      elif (contains_target and rule == False) or (not contains_target and rule == True):
        checks.addFailure("", title_prefix + syntax, self.syntax_map[syntax], fail_prefix + syntax + " in your code")

# Make sure we don't forget and import *
class OtherTests(TestCase):
  def test_tests(self):
    """Testing for careless imports"""
    self.assertTrue(False, "You should not import * on this module")

def main(verbose=False, names=None):
  glob = globals() # globals() still needs work
  if names == None:
    names = glob
  for name in names:
    if issubclass(glob[name],TestCase):
      try:
        tc = glob[name]()
        tc.verbose = verbose
        tc.main()
      except Exception as err:
        raise err
