import { LogInAuth } from "../components/loginAuth";

export default function AuthPage() {
  return (
    <div className="flex-col justify-items-center mt-12">
      <p className="text-4xl text-center font-bold font-sans">
        {" "}
        Old.St Appointment Booking System
      </p>
      <LogInAuth />
    </div>
  );
}
