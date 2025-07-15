function Fruits() {
  const fruits = [
    {
      name: "apple",
      price: "$10",
    },
    {
      name: "banana",
      price: "$5",
    },
    {
      name: "orange",
      price: "$15",
    },
    {
      name: "pineapple",
      price: "$52",
    },
  ];
  return (
    <div>
      <ul>
        {fruits.map((val) => {
          return (
            <li>
              {val.name} {val.price}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Fruits;
