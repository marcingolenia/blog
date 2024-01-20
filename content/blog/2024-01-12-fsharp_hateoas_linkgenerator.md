---
title: Let's try .net LinkGenerator, will it make working with links easier?
description: >-
    This is a continuation to "HATEOAS in F#" post. Let's try to simplify link generatrion in our Hogwarts accommodation API. 
date: 2024-01-21T08:44:00+01:00
draft: false
tags:
  - fsharp
  - rest
image: /images/restglory2.png
---
## Intro
This is 2nd post in this 3-post series:
1. [HATEOAS in F#](/blog/2023-12-23-fsharp_hateoas/) + [source code](https://github.com/marcingolenia/hateoas_fsharp)
2. Let's try LinkGenerator to see if it can simplify HATEOAS implementation (this post) + [source code](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator)
3. Consuming RESTful API and leveraging HATEOAS (coming soon)

Some libraries have built-in mechanics which can help us in creating HATEOAS. In spring we have `WebMvcLinkBuilder`, in .net MVC we have `IUrlHelper`, now in .net core minimal APIs we have `LinkGenerator`. Let's check if this can actually help. [Here](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator) you can find the updated code.

### What is LinkGenerator
From MSDN [1] docs:

> LinkGenerator efines a contract to generate absolute and related URIs based on endpoint routing.

I've found an example in C# on a blog [2]: 

Some endpoints:
```csharp
app.MapGet("/messages", Ok<List<TextMessageDto>> () =>
{
    List<TextMessageDto> textMessages = new()
    {
        new TextMessageDto { Id = 1, Message = "Hello, World!"},
        new TextMessageDto { Id = 1, Message = "Yet another Hello, World!"}
    };
    return TypedResults.Ok(textMessages);
}).WithName("readmessages");

app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id) =>
{
    //TODO : Implement a lookup for messages
    return TypedResults.Ok(new TextMessageDto { Id = id, Message = $"Hello, World! The id is {id}" });
}).WithName("readmessagebyid");

app.MapPut("/messages/{id}", (...) =>
{
    //update message
}).WithName("updatemessage");

app.MapDelete("/messages/{id}", (...) =>
{
    //delete message
}).WithName("deletemessage");
```

And an endpoint that uses LinkGenerator:
```csharp
//use the LinkGenerator class to build the url for each endpoint by using the endpointname associated with each endpoint 
app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id, HttpContext httpContext, LinkGenerator linkGenerator) =>
{
    TextMessageDto textMessage = new() { Id = id, Message = $"Hello, World from {id}" };
    List<LinkDto> links = new()
    {
        new LinkDto(linkGenerator.GetUriByName(httpContext, "readmessagebyid",values: new{id})!, "self", "GET"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "updatemessage",values: new{id})!, "update_message", "PUT"),
        new LinkDto(linkGenerator.GetUriByName(httpContext, "deletemessage",values: new{id})!, "delete_message", "DELETE")
    };
    textMessage.Links = links;
    return TypedResults.Ok(textMessage);
})
.WithName("readmessagebyid");
```
I see some tradeoffs:
1. It looks that it can save us from some troubles when we want to do some changes in our API that involve changing URI paths as we 
can refer to an endpoint by name instead of the full API path, but we have to bother now with naming the endpoints.
2. We don't have to hardcode paths versus we have to hardcode endpoint names.
3. While in C# we can get some extra typesafety (in C# string interpolation actually doesn't check the types), we can have the same benefit in F# by using typed interpolated strings, so let's pretend that this point doesn't exist (as this is blog post about F# not C#).

So... I am somewhat sceptical but let's go. We have to try it, before I can make an opinion.

## Using Link Generator in F# Giraffe
LinkGenerator can be retrieved from services by quering .net HttpContext like so;
```fsharp
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let linker = ctx.GetService<LinkGenerator>()
```
The most important 2 methods are `GetPathByName` and `GetUriByName`. Let's consider `http://localhost/accommodation/houses/Gryffindor`. The first will return the path - so `/accommodation/houses/Gryffindor` from the URL, the second will include the protocol and domain name. Both are good - depends if You want the client to handle the protocol and domain or if You want to provide full URL.

### Adding it to our API
The endpoint definition `will change slightly (names are just added): 
```fsharp
let endpoints =
    [
      OPTIONS [
          route "/" readOptions
      ]
      GET [
            routef "/houses/%s/students" readStudentsBy |> addMetadata(EndpointNameMetadata "get_house_students") 
            routef "/houses/%s" readHouseBy |> addMetadata(EndpointNameMetadata "get_houses_by") 
            route "/houses" readHouses |> addMetadata(EndpointNameMetadata "get_houses")
          ]
      DELETE [
          routef "/houses/%s/students/%s" deleteStudentBy
      ]
    ]
```
and let's see how the route "/houses" `readHouses` looks like: 
```fsharp
let readHouses: HttpHandler =
    fun (next: HttpFunc) (ctx: HttpContext) ->
        let linker = ctx.GetService<LinkGenerator>()
        let data =
            houses
            |> List.map (fun house ->
                { Name = house.Name.ToString()
                  Links =
                    [ { Rel = "self"
                        Href = linker.GetPathByName("get_houses_by", {|s0 = house.Name.ToString()|}) }
                      { Rel = "all_students"
                        Href = linker.GetPathByName("get_house_students", {|s0 = house.Name.ToString()|})}
                    ]})
        json data next ctx
```

You can see other endpoints in the [Full source code](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator). But wait... `s0``... what's that? ...

### Giraffe uses format strings...
Yup. So in C# You have this:
```csharp
app.MapGet("/messages/{id}", Ok<TextMessageDto> (int id) =>
```
in F# You have this:
```fsharp
 GET [
       routef "/messages/%s" func test 
     ]
```
and `messages/%s` at the end of the day is translated to route template and looks like this: 
![](/images/linker_giraffe.png)

This may look strange, especially when You look on my anonymous records `{|s0 = house.Name.ToString()|}` but it doesn't hurt readibility that much if I can understand what endpoint I am refering to - I am passing it's name. So instead `get_house_students` I can name it `get_students_by_house_name` and then I know that `s0` is house name. For multiple route paramaters I can work on the naming as well, for example `get_students_by_house_name_and_year` and I can pass `{|s0 = "Slytherin"; i0 = 1989|}`. 

Actually I have opened a [GitHub issue](https://github.com/giraffe-fsharp/Giraffe/issues/569) maybe I don't know something, maybe this can be improved in the near future.

### Other frameworks - Let's try in Falco
I hoped that in falco it will be possible to name an endpoint and pass record with peroper names instead {s0}, {s1} and so on as it uses route templates instead of format strings. First impression was good:
![](/images/linker_falco.png)

but I was not able add endpoint name. In C# when we use `map`, `mapGet` etc we operate on `IEndpointConventionBuilder` whereas in Falco we operate on `HttpEndpoint` (Falco built-in type) and in Giraffe on `Endpoint` built-in type. Giraffe provides addMetadata function to extend the configuration while in Falco we don't have such option (at least for now).

## Conclusions
I don't have to think about parent path in my routing when I am dealing with subRoute, so from our Program.fs file: 
```fsharp
let endpoints useMocks =
    let auth = if useMocks then applyBefore fakeAuth else id
    [
        GET [ route "/health" (text "Up") ]
        auth (subRoute "/accommodation" HouseAllocation.Router.endpoints)
    ]
```

I can forget about the `/accomodation` fragment. This in my eyes is a big benefit as the subroute links will continue to work when I will change the `/accomodation` to for example `/hausing`. Without it I will break all links and I will have to update each of them separetely. The s0, s1, s2... i0 etc may look bad, but at the end of the day I love to have format strings as part of my routing which automatically can validate my handler function paramater types. I am going to use LinkGenerator. 

The final conclusion is that is it worth to test a thing by your own before you give a rigid opinion. 

---
**References:**\
[1] [MSDN LinkGenerator](https://learn.microsoft.com/pl-pl/dotnet/api/microsoft.aspnetcore.routing.linkgenerator)\
[2] [Minimal APIs and HATEOAS, Poornima Nayar](https://poornimanayar.co.uk/blog/minimal-apis-and-hateoas)\
[3] https://github.com/giraffe-fsharp/Giraffe/issues/569\
[4] [Full source code](https://github.com/marcingolenia/hateoas_fsharp/tree/link_generator)