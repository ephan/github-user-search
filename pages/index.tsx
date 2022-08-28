import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { format } from "path";
import { FormEvent, useState, useEffect } from "react";
import { Octokit } from "@octokit/rest";
import UserCard from "../components/UserCard";
import Pagination from "../components/Pagination";

type FormData = {
  searchText: string;
};

const RESULTS_PER_PAGE = 9;

const Home: NextPage = () => {
  const [form, setForm] = useState<FormData>({ searchText: "" });
  const [results, setResults] = useState<Array<ResultData>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (form?.searchText !== "") getData(form?.searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const getData = async (searchText: string) => {
    //check to see if the {searchText, currentPage} key exsists in localStorage
    const retrievedData = localStorage.getItem(
      JSON.stringify({ search: searchText, page: currentPage })
    );
    if (retrievedData) {
      setResults(JSON.parse(retrievedData)?.data || []);
      setTotalPages(JSON.parse(retrievedData)?.totalPages || 1);
      return;
    }

    try {
      const octokit = new Octokit({
        auth: process.env.GITHUB_SECRET,
      });

      // octokit.search.users() returns up to 30 results at a time, but we specify the RESULTS_PER_PAGE
      // this api only returns partial list of user data, we need a 2nd api call to get the full user data
      const searchUserData = await octokit.search.users({
        q: searchText,
        page: currentPage,
        per_page: RESULTS_PER_PAGE,
      });

      if (searchUserData?.data?.items) {
        const computedTotalPages =
          Math.floor(
            (searchUserData?.data?.total_count || 0) / RESULTS_PER_PAGE
          ) + 1;
        setTotalPages(computedTotalPages);

        //call second api for each user returned
        const urls = searchUserData?.data?.items.map(
          (user) => `GET /users/${user.login}`
        );

        //Promise.all ensures we get results all at once
        let resultData = await Promise.all(
          urls.map((url) =>
            octokit.request(url, {
              username: "USERNAME",
            })
          )
        );

        if (resultData && Array.isArray(resultData)) {
          const userData: ResultData[] = resultData.map((user) => user.data);
          setResults(userData);

          //cache results - I'm caching both the data and the number of pages
          //key : { search: searchText, page: currentPage }
          //value : { data: jsonData, totalPages: computedTotalPages }
          localStorage.setItem(
            JSON.stringify({ search: searchText, page: currentPage }),
            JSON.stringify({
              data: userData,
              totalPages: computedTotalPages,
            })
          );
        }
      }
    } catch (error) {
      setTotalPages(0); //removes pagination next links
      alert(error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    //reset current page
    setCurrentPage(1);
    if (form?.searchText) getData(form?.searchText);
  };

  const handlePaginationClick = (e: FormEvent, newPage: number) => {
    e.preventDefault();
    setCurrentPage(newPage); //useEffect will be triggered
  };

  return (
    <div className="my-7 mx-auto max-w-5xl">
      <Head>
        <title>Github Search App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Search */}
      <main className="sticky top-0 z-50 flex bg-white px-0 py-2 shadow-sm">
        <form
          className="w-full lg:pl-1 sm:pl-0"
          onSubmit={(e) => handleSubmit(e)}
        >
          <input
            type="text"
            className="border rounded p-1 w-[50%] hover:shadow"
            placeholder="Search name, email address, username, etc..."
            value={form.searchText}
            onChange={(e) => setForm({ ...form, searchText: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white rounded px-5 py-1 ml-1"
          >
            Search
          </button>
        </form>
      </main>

      {/* Results */}
      <div className="flex flex-wrap justify-center">
        {results?.map((user) => (
          <UserCard user={user} key={user.login} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        handlePaginationClick={handlePaginationClick}
      />
    </div>
  );
};

export default Home;
