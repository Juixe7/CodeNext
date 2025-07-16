const mongoose = require("mongoose");
require("dotenv").config();
const Problem = require("./src/models/problem");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    console.log("✅ Database connected successfully.");
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  }
};

const runMigration = async () => {
  await connectDB();

  try {
    // 1. Update Two Sum
    const twoSumDriverCode = [
      {
        language: "C++",
        code: `int main() {
    int size;
    if (!(cin >> size)) return 0;
    
    int arr[size];
    for(int i = 0; i < size; i++) {
        cin >> arr[i];
    }
    
    int target;
    cin >> target;

    pair<int, int> res = twoSum(arr, size, target);
    cout << res.first << " " << res.second << endl;
    return 0;
}`
      },
      {
        language: "Java",
        code: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) return;
        int size = scanner.nextInt();
        int[] arr = new int[size];
        for(int i = 0; i < size; i++) {
            arr[i] = scanner.nextInt();
        }
        int target = scanner.nextInt();
        Solution solution = new Solution();
        int[] res = solution.twoSum(arr, size, target);
        System.out.println(res[0] + " " + res[1]);
    }
}`
      },
      {
        language: "JavaScript",
        code: `const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);
if (input.length < 2) process.exit(0);
const size = parseInt(input[0]);
const arr = [];
for(let i = 1; i <= size; i++) {
    arr.push(parseInt(input[i]));
}
const target = parseInt(input[size + 1]);
const res = twoSum(arr, size, target);
console.log(res[0] + " " + res[1]);`
      }
    ];

    const twoSumUpdate = await Problem.findOneAndUpdate(
      { title: { $regex: /Two Sum/i } },
      { $set: { driverCode: twoSumDriverCode } },
      { new: true }
    );

    if (twoSumUpdate) {
      console.log("✅ Successfully updated 'Two Sum' with driverCode.");
    } else {
      console.log("⚠️ Could not find 'Two Sum' in the database.");
    }

    // 2. Update Valid Parentheses
    const validParenthesesDriverCode = [
      {
        language: "C++",
        code: `int main() {
    string s;
    if (!(cin >> s)) return 0;
    
    if (isValid(s)) {
        cout << "true";
    } else {
        cout << "false";
    }
    return 0;
}`
      },
      {
        language: "Java",
        code: `import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNext()) return;
        String s = scanner.next();
        Solution solution = new Solution();
        if (solution.isValid(s)) {
            System.out.print("true");
        } else {
            System.out.print("false");
        }
    }
}`
      },
      {
        language: "JavaScript",
        code: `const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf-8').trim();
if (!input) process.exit(0);
if (isValid(input)) {
    console.log("true");
} else {
    console.log("false");
}`
      }
    ];

    const vpUpdate = await Problem.findOneAndUpdate(
      { title: { $regex: /Valid Parentheses/i } },
      { $set: { driverCode: validParenthesesDriverCode } },
      { new: true }
    );

    if (vpUpdate) {
      console.log("✅ Successfully updated 'Valid Parentheses' with driverCode.");
    } else {
      console.log("⚠️ Could not find 'Valid Parentheses' in the database.");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
};

runMigration();
