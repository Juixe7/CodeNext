import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Schema validation for the signup form
const signupSchema = z.object({
  firstName: z.string().min(3, "Name should contain at least 3 characters"),
  emailId: z.email("Invalid email address"),
  password: z.string().min(8, "Password should contain at least 8 characters"),
});
{
}
function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const submittedData = (data) => {
    console.log(data);
  };
  return (
    <>
     <form onSubmit={handleSubmit(submittedData)} className="font-poppins min-h-screen flex justify-center items-center bg-gray-900">
  <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-6">
    <h2 className="text-2xl font-bold text-white text-center">Create an Account</h2>

    {/* First Name */}
    <div className="form-control">
      <label className="label text-white">First Name</label>
      <input
        {...register('firstName')}
        type="text"
        placeholder="e.g. John"
        className="input input-bordered bg-gray-700 text-white placeholder-gray-400"
      />
      <span className="text-red-400 text-sm min-h-[1.25rem] block">{errors.firstName?.message}</span>
    </div>

    {/* Email */}
    <div className="form-control">
      <label className="label text-white">Email Address</label>
      <input
        {...register('emailId')}
        type="email"
        placeholder="e.g. john@example.com"
        className="input input-bordered bg-gray-700 text-white placeholder-gray-400"
      />
      <span className="text-red-400 text-sm min-h-[1.25rem] block">{errors.emailId?.message}</span>
    </div>

    {/* Password */}
    <div className="form-control">
      <label className="label text-white">Password</label>
      <input
        {...register('password')}
        type="password"
        placeholder="Enter a secure password"
        className="input input-bordered bg-gray-700 text-white placeholder-gray-400"
      />
      <span className="text-red-400 text-sm min-h-[1.25rem] block">{errors.password?.message}</span>
    </div>

    <button type="submit" className="btn btn-soft btn-primary self-center w-32">
      Submit
    </button>
  </div>
</form>
    </>
  );
}

export default Signup;

//     const [name,setName] = useState('');
//     const [email,setEmail] = useState('');
//     const [password,setPassword] = useState('');

//     const handleSubmit=(e)=>{
//       e.preventDefault();
//       console.log(name,email,password);
//      //validation of the user input data

//       //form ko submit kardenge
//       //backend submission
//     }

//    return (
//     <form onSubmit={handleSubmit} className="min-h-screen flex flex-col justify-center items-center gap-y-4" >
//     <input type="text" value={name} placeholder="Enter your first Name" onChange={(e)=>{setName(e.target.value)}}></input>
//     <input type="email" value={email} placeholder="Enter your email" onChange={(e)=>{setEmail(e.target.value)}}></input>
//     <input type="password" value={password} placeholder="Enter your password" onChange={(e)=>{setPassword(e.target.value)}}></input>
//     <button type="submit">Submit</button>
//     </form>
//    )
