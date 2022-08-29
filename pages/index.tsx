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
  sort: string;
};

type SortBy = "followers" | "repositories" | "joined" | undefined;
type SortOrder = "asc" | "desc" | undefined;

const RESULTS_PER_PAGE = 9;

const Home: NextPage = () => {
  const [form, setForm] = useState<FormData>({ searchText: "", sort: "" });
  const [results, setResults] = useState<Array<ResultData>>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [noResults, setNoResults] = useState(false);

  // monitor currentPage and requery if currentPage changes
  useEffect(() => {
    if (form?.searchText !== "") getData(form?.searchText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // monitor noResults and reset results and pagination if noResults is true
  useEffect(() => {
    if (noResults) {
      setResults([]); // reset results
      setTotalPages(0); //removes pagination next links
    }
  }, [noResults]);

  const getData = async (searchText: string) => {

    //check to see if the {form, currentPage} key exists in localStorage
    const retrievedData = localStorage.getItem(
      JSON.stringify({ search: form, page: currentPage })
    );

    //the key exists, but could be empty
    if (retrievedData) {
      const parsedData = JSON.parse(retrievedData);

      setResults(parsedData?.data || []);
      setTotalPages(parsedData?.totalPages || 1);

      if (!parsedData?.data?.length) setNoResults(true);
      else setNoResults(false);
      return;
    }

    try {
      const octokit = new Octokit({
        auth: process.env.GITHUB_SECRET,
      });

      //split form.sort "sort order" into two arrays
      const [sortBy, sortOrder] = form.sort.split(" ");

      // octokit.search.users() returns up to 30 results at a time, but we specify the RESULTS_PER_PAGE
      // this api only returns partial list of user data, we need a 2nd api call to get the full user data
      const searchUserData = await octokit.search.users({
        q: searchText,
        page: currentPage,
        per_page: RESULTS_PER_PAGE,
        sort: sortBy as SortBy,
        order: sortOrder as SortOrder,
      });

      if (searchUserData?.data?.items?.length > 0) {
        //computing the total number of pages
        let computedTotalPages = Math.floor(
          (searchUserData?.data?.total_count || 0) / RESULTS_PER_PAGE
        );
        if (searchUserData?.data?.items?.length % RESULTS_PER_PAGE > 0)
          computedTotalPages++;
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
          setNoResults(false);

          //cache results - I'm caching both the data and the number of pages
          //key : { search: form, page: currentPage }
          //value : { data: userData, totalPages: computedTotalPages }
          localStorage.setItem(
            JSON.stringify({ search: form, page: currentPage }),
            JSON.stringify({
              data: userData,
              totalPages: computedTotalPages,
            })
          );
        }
      } else { //no results
        setNoResults(true);
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
      <main className="sticky top-0 z-50 bg-white px-0 py-2 shadow-sm">
        <form
          className="lg:pl-1 sm:pl-0 flex flex-wrap"
          onSubmit={(e) => handleSubmit(e)}
        >
          <input
            type="text"
            className="border rounded p-1 lg:grow-1 lg:shrink-0 hover:shadow lg:basis-[50%] sm:basis-[100%] lg:w-[50%] w-full"
            placeholder="Search name, email address, username, etc..."
            value={form.searchText}
            required
            onChange={(e) => setForm({ ...form, searchText: e.target.value })}
          />

          <div className="lg:basis-[48%] sm:basis-[100%]">
            <select
              className="border lg:ml-1 p-1 shrink-0 grow-1  sm:basis-[50%] sm:y-3"
              onChange={(e) => setForm({ ...form, sort: e.target.value })}
            >
              <option value="">Sort By</option>
              <option value="followers asc">Followers Ascending</option>
              <option value="followers desc">Followers Descending</option>
              <option value="repositories asc">Repositories Ascending</option>
              <option value="repositories desc">Repositories Descending</option>
              <option value="joined asc">Date Joined Ascending</option>
              <option value="joined desc">Date Joined Descending</option>
            </select>

            <button
              type="submit"
              className="bg-blue-500 text-white rounded px-5 py-1 ml-1  sm:basis-[50%] sm:y-3 self-end"
            >
              Search
            </button>
          </div>
        </form>
      </main>

      {/* Results */}
      <div className="flex flex-wrap justify-center">
        {noResults === true && (
          <div className="justify-center">There are no results ...</div>
        )}
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
