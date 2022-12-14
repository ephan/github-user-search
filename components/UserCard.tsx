import { MapPinIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import Moment from "react-moment";

type Props = {
  user: ResultData;
};

function UserCard({ user }: Props) {
  return (
    <div className="flex lg:basis-[32%] grow shrink-0 md:basis-[98%] sm:basis-[98%]
                    lg:mx-1 sm:mx-0 my-1 lg:p-4 sm:p-2 items-top rounded-md border border-gray-300 bg-white shadow-sm hover:border 
                    hover:border-gray-600 hover:bg-gray-100 lg:h-[200px] truncate overflow-hidden w-full">

      <div className="self-center shadow-2xl">
      <Image
        height="128px"
        width="128px"
        src={user.avatar_url}
        layout="fixed"
        className="top-1 h-[128px] !min-w-[128px] self-center"
        alt={user.login}
      />

      </div>
      <div className="ml-3 truncate w-[calc(100%-128px)] text-xs self-center">
        {user.name && (
          <div>
            <label>Name:</label>
              {user.name}
          </div>
        )}
        {user.location && (
          <div className="">
            <label>
              <MapPinIcon className="w-4 h-4 inline-block" />
            </label>
            {user.location}
          </div>
        )}
        {user.email && (
          <div>
            <label>Email:</label>{user.email}
          </div>
        )}
        <div>
          <label>Login:</label>
          <Link href={user.html_url} passHref>
            <a className="ml-1" target="_blank">
              {user.login}
            </a>
          </Link>
        </div>
        <div>
          <label>Number of Repos:</label>
          <Link href={user.html_url + "?tab=repositories"} passHref>
            <a className="ml-1" target="_blank">
              {user.public_repos}
            </a>
          </Link>
        </div>
        <div className="truncate">
          <label>Created:</label>
          <Moment className="truncate" format="MMMM Do YYYY, h:mma">{user.created_at}</Moment>
        </div>
        <div className="truncate">
          <label>Updated:</label>
          <Moment className="truncate" format="MMMM Do YYYY, h:mma">{user.updated_at}</Moment>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
