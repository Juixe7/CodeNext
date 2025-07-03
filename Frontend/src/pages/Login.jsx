import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Schema validation for the signup form
const signupSchema = z.object({
  emailId: z.email("Invalid email address"),
  password: z.string().min(8, "Password should contain at least 8 characters"),
});

function Login() {
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
    <h2 className="text-2xl font-bold text-white text-center">Log into Account</h2>
      
      
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

export default Login;